/**
 * Navy Payroll - mDNS Responder
 * Advertises navypayroll.local on the LAN automatically.
 * Works on WiFi AND Ethernet — no client config needed.
 *
 * Run standalone : node mdns.js
 * Run as service : added automatically via install-service.js
 */

const os      = require('os');
const dgram   = require('dgram');
const path    = require('path');
const dotenv  = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const DOMAIN = (process.env.LOCAL_DOMAIN || 'navypayroll.local').replace(/\.$/, '') + '.';
const MDNS_ADDR = '224.0.0.251';
const MDNS_PORT = 5353;

// The LAN IP we want to advertise. setup.bat writes this into .env.
// We ONLY advertise addresses on this IP's subnet, so connecting the
// server to the internet (which adds a WAN/Wi-Fi NIC) can never leak an
// unreachable, wrong-subnet address into clients' caches.
const LOCAL_IP = process.env.LOCAL_IP || null;

// ── ipv4 helpers ──────────────────────────────────────────
function ipToInt(ip) {
  return ip.split('.').reduce((acc, o) => (acc << 8) + (Number(o) & 0xff), 0) >>> 0;
}
function sameSubnet(a, b, netmask) {
  const m = ipToInt(netmask);
  return (ipToInt(a) & m) === (ipToInt(b) & m);
}

// ── Get LAN interface entries ({address, netmask}) ────────
// IPv4, non-loopback. If LOCAL_IP is set, keep only interfaces whose
// subnet contains LOCAL_IP; otherwise fall back to all (old behavior).
function getLanInterfaces() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const iface of Object.values(ifaces)) {
    for (const addr of iface) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (LOCAL_IP && !sameSubnet(addr.address, LOCAL_IP, addr.netmask)) continue;
      out.push({ address: addr.address, netmask: addr.netmask });
    }
  }
  return out;
}

// Addresses to advertise. Prefer exactly LOCAL_IP when present so we
// never publish more than one A record by accident.
function getLanIPs() {
  const ifaces = getLanInterfaces();
  if (LOCAL_IP && ifaces.some((i) => i.address === LOCAL_IP)) return [LOCAL_IP];
  return ifaces.map((i) => i.address);
}

// Encode DNS name: navypayroll.local. → \x0bnavypayroll\x05local\x00
function encodeName(n) {
  const buf = [];
  for (const label of n.replace(/\.$/, '').split('.')) {
    buf.push(label.length, ...Buffer.from(label));
  }
  buf.push(0);
  return Buffer.from(buf);
}

// ── Build ONE DNS response packet carrying every A record ──
// All addresses go in a single packet as multiple answer RRs. The
// cache-flush bit (class 0x8001) then means "this packet is the complete,
// authoritative set for this name" — clients keep ALL of them.
//
// The previous version sent one cache-flush packet per IP, so each packet
// wiped the one before it and only the last IP survived in the client
// cache. That is what broke resolution the moment a second NIC appeared.
function buildResponse(name, ips, id = 0) {
  const list = Array.isArray(ips) ? ips : [ips];
  const nameBuf = encodeName(name);

  const header = Buffer.alloc(12);
  header.writeUInt16BE(id,          0); // Transaction ID
  header.writeUInt16BE(0x8400,      2); // Flags: Response, Authoritative
  header.writeUInt16BE(0,           4); // Questions: 0
  header.writeUInt16BE(list.length, 6); // Answer RRs: one per IP
  header.writeUInt16BE(0,           8); // Authority RRs: 0
  header.writeUInt16BE(0,          10); // Additional RRs: 0

  const answers = list.map((ip) => {
    const rdata  = Buffer.from(ip.split('.').map(Number)); // 4 bytes
    const answer = Buffer.alloc(nameBuf.length + 10 + rdata.length);
    let offset = 0;
    nameBuf.copy(answer, offset); offset += nameBuf.length;
    answer.writeUInt16BE(0x0001, offset); offset += 2; // Type: A
    answer.writeUInt16BE(0x8001, offset); offset += 2; // Class: IN + cache-flush
    answer.writeUInt32BE(120,    offset); offset += 4; // TTL: 120 seconds
    answer.writeUInt16BE(4,      offset); offset += 2; // RDLENGTH: 4
    rdata.copy(answer, offset);
    return answer;
  });

  return Buffer.concat([header, ...answers]);
}

// ── Parse incoming DNS question ───────────────────────────
function parseQuestion(msg) {
  try {
    const qdCount = msg.readUInt16BE(4);
    if (qdCount === 0) return null;

    let offset = 12;
    const labels = [];
    while (offset < msg.length) {
      const len = msg[offset++];
      if (len === 0) break;
      if ((len & 0xc0) === 0xc0) { offset++; break; } // pointer
      labels.push(msg.slice(offset, offset + len).toString());
      offset += len;
    }
    const qtype = msg.readUInt16BE(offset);
    const id    = msg.readUInt16BE(0);
    return { name: labels.join('.') + '.', qtype, id };
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────
console.log('Navy Payroll — mDNS Responder');
console.log('==============================');
console.log(`Domain  : ${DOMAIN}`);

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

socket.on('error', (err) => {
  console.error('❌ mDNS socket error:', err.message);
  if (err.code === 'EACCES') {
    console.error('   Port 5353 requires elevated privileges.');
    console.error('   Run this service as Administrator.');
  }
  process.exit(1);
});

socket.on('message', (msg, rinfo) => {
  const q = parseQuestion(msg);
  if (!q) return;

  // Only respond to A-record (1) or ANY (255) queries for our domain
  if (q.qtype !== 1 && q.qtype !== 255) return;
  if (q.name.toLowerCase() !== DOMAIN.toLowerCase()) return;

  const ips = getLanIPs();
  if (ips.length === 0) {
    console.warn('⚠️  No LAN IPs found — skipping response');
    return;
  }

  console.log(`[${new Date().toISOString()}] Query from ${rinfo.address} for ${q.name} → responding with ${ips.join(', ')}`);

  // One packet, all A records — see buildResponse for why.
  const response = buildResponse(DOMAIN, ips, q.id);
  socket.send(response, 0, response.length, MDNS_PORT, MDNS_ADDR, (err) => {
    if (err) console.error('❌ Send error:', err.message);
  });
});

socket.bind(MDNS_PORT, () => {
  // Join the multicast group on EVERY LAN interface, not just the default
  // one. With multiple NICs, joining only the default interface means
  // queries arriving on the other NIC (or after the default route changes
  // when internet connects) are never heard.
  const lanIfaces = getLanInterfaces();
  if (lanIfaces.length === 0) {
    try { socket.addMembership(MDNS_ADDR); } catch (e) {
      console.warn('⚠️  addMembership (default) failed:', e.message);
    }
  } else {
    for (const { address } of lanIfaces) {
      try { socket.addMembership(MDNS_ADDR, address); } catch (e) {
        console.warn(`⚠️  addMembership on ${address} failed:`, e.message);
      }
    }
  }
  socket.setMulticastTTL(255);
  socket.setMulticastLoopback(true);

  const ips = getLanIPs();
  console.log(`LAN IPs : ${ips.join(', ') || 'none found'}`);
  console.log(`Listening on ${MDNS_ADDR}:${MDNS_PORT}`);
  console.log('');
  console.log('Clients can now reach the server at:');
  console.log(`  https://${DOMAIN.replace(/\.$/, '')}`);
  console.log('');
  console.log('No config needed on any client machine.');
  console.log('Works on WiFi and Ethernet automatically.');
});

// ── Announce presence on startup (unsolicited response) ───
socket.on('listening', () => {
  const ips = getLanIPs();
  if (ips.length === 0) return;
  const announcement = buildResponse(DOMAIN, ips);
  setTimeout(() => {
    socket.send(announcement, 0, announcement.length, MDNS_PORT, MDNS_ADDR);
  }, 1000); // slight delay to let socket fully initialize
});

process.on('SIGINT',  () => { socket.close(); process.exit(0); });
process.on('SIGTERM', () => { socket.close(); process.exit(0); });