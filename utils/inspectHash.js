"use strict";

/**
 * utils/inspectHash.js  —  legacy hash inspector / comparator
 * -----------------------------------------------------------------------------
 * Console tool to see what each hashing technique produces for a given password,
 * and to inspect/verify a real stored value from hr_employees.password.
 *
 * Usage:
 *   node utils/inspectHash.js <password>
 *       -> prints md5, identity(PBKDF2 v2 & v3) and argon2 output for <password>
 *
 *   node utils/inspectHash.js <password> "<storedHashOrPlaintext>"
 *       -> detects the stored format, shows a structural breakdown,
 *          and verifies <password> against it
 *
 * Examples:
 *   node utils/inspectHash.js hello
 *   node utils/inspectHash.js hello 5d41402abc4b2a76b9719d911017c592
 *   node utils/inspectHash.js "Passw0rd!" "AQAAAAEAACcQAAAAE..."
 */

const crypto = require("crypto");
const argon2 = require("argon2");
const { detectFormat, verifyHashed } = require("./legacyPassword");

// --- generators (so you can compare formats for a known password) -----------

function makeMd5(pw) {
  return crypto.createHash("md5").update(pw, "utf8").digest("hex");
}

// ASP.NET Core Identity v2: [0x00][16B salt][32B subkey] PBKDF2-HMAC-SHA1 x1000
function makeIdentityV2(pw) {
  const salt = crypto.randomBytes(16);
  const subkey = crypto.pbkdf2Sync(Buffer.from(pw), salt, 1000, 32, "sha1");
  const out = Buffer.concat([Buffer.from([0x00]), salt, subkey]);
  return out.toString("base64");
}

// ASP.NET Core Identity v3: [0x01][prf u32][iter u32][saltLen u32][salt][subkey]
function makeIdentityV3(pw, iter = 10000) {
  const salt = crypto.randomBytes(16);
  const subkey = crypto.pbkdf2Sync(Buffer.from(pw), salt, iter, 32, "sha256");
  const head = Buffer.alloc(13);
  head.writeUInt8(0x01, 0);
  head.writeUInt32BE(1, 1); // prf = SHA256
  head.writeUInt32BE(iter, 5);
  head.writeUInt32BE(salt.length, 9);
  return Buffer.concat([head, salt, subkey]).toString("base64");
}

// --- structural breakdown of a stored value ---------------------------------

function describe(stored) {
  const format = detectFormat(stored);
  const lines = [`format:        ${format}`];

  if (format === "md5") {
    lines.push(`length:        ${stored.length} hex chars (128-bit digest)`);
    lines.push(`salted:        no`);
  } else if (format === "argon2") {
    lines.push(`encoded:       ${stored.split("$").slice(0, 4).join("$")}$...`);
  } else if (format === "identity") {
    const buf = Buffer.from(stored, "base64");
    const marker = buf.readUInt8(0);
    if (marker === 0x00) {
      lines.push(`variant:       v2 (marker 0x00)`);
      lines.push(`kdf:           PBKDF2-HMAC-SHA1, 1000 iterations`);
      lines.push(`salt:          16 bytes`);
      lines.push(`subkey:        ${buf.length - 17} bytes`);
    } else if (marker === 0x01) {
      const prf = { 0: "SHA1", 1: "SHA256", 2: "SHA512" }[buf.readUInt32BE(1)];
      const iter = buf.readUInt32BE(5);
      const saltLen = buf.readUInt32BE(9);
      lines.push(`variant:       v3 (marker 0x01)`);
      lines.push(`kdf:           PBKDF2-HMAC-${prf}, ${iter} iterations`);
      lines.push(`salt:          ${saltLen} bytes`);
      lines.push(`subkey:        ${buf.length - 13 - saltLen} bytes`);
    }
  } else if (format === "plaintext") {
    lines.push(`note:          NOT hashed — login is blocked, first-time change forced`);
  }
  return lines.join("\n");
}

// --- main -------------------------------------------------------------------

(async () => {
  const [password, stored] = process.argv.slice(2);

  if (!password) {
    console.log("Usage: node utils/inspectHash.js <password> [storedHash]");
    process.exit(1);
  }

  const bar = "─".repeat(72);

  if (!stored) {
    // Comparison mode: show every technique's output for this password.
    const argon = await argon2.hash(password);
    console.log(bar);
    console.log(`Comparing hash techniques for password: "${password}"`);
    console.log(bar);
    console.log(`plaintext      ${password}`);
    console.log(`md5 (legacy)   ${makeMd5(password)}`);
    console.log(`identity v2    ${makeIdentityV2(password)}`);
    console.log(`identity v3    ${makeIdentityV3(password)}`);
    console.log(`argon2 (new)   ${argon}`);
    console.log(bar);
    console.log("Note: md5 is deterministic (same every run); identity & argon2");
    console.log("include a random salt, so they differ on each run.");
    console.log(bar);
    return;
  }

  // Inspect + verify mode.
  console.log(bar);
  console.log(`Inspecting stored value for password: "${password}"`);
  console.log(bar);
  console.log(`stored:        ${stored}`);
  console.log(describe(stored));
  console.log(bar);

  if (detectFormat(stored) === "plaintext") {
    const match = stored === password;
    console.log(`plaintext match: ${match ? "YES" : "no"}  (login would force first-time change either way)`);
  } else {
    const { ok, format, needsRehash } = await verifyHashed(password, stored);
    console.log(`verify result:   ${ok ? "✅ MATCH" : "❌ no match"}  (via ${format})`);
    console.log(`would rehash:    ${needsRehash ? "yes -> argon2" : "no"}`);
  }
  console.log(bar);
})();
