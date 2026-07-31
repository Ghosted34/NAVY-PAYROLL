"use strict";

/**
 * scripts/migratePasswords.js  —  ONE-OFF password migration
 * -----------------------------------------------------------------------------
 * Copies emolument.aspnetusers.PasswordHash into hicaddata.hr_employees.password,
 * joined on   aspnetusers.UserName = hr_employees.Empl_ID.
 *
 * force_change rule:
 *   - hashed value (argon2 / identity-PBKDF2 / md5)  -> force_change = 0
 *   - plaintext or empty/null                        -> force_change = 1
 *   (the value is copied either way, per spec)
 *
 * SAFETY: dry-run by default. Nothing is written unless you pass --commit.
 *
 * Usage:
 *   node scripts/migratePasswords.js                 # dry-run, prints a full report
 *   node scripts/migratePasswords.js --limit 50      # dry-run on first 50 source rows
 *   node scripts/migratePasswords.js --commit        # ACTUALLY writes the updates
 *
 * Env (from .env.local / .env.production via config):
 *   MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_PORT
 *   MYSQL_DB_OFFICERS   -> target DB (hicaddata)
 *   MYSQL_DB_EMOLUMENT  -> source DB (defaults to "emolument")
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("../config");
const { detectFormat } = require("../utils/legacyPassword");

const COMMIT = process.argv.includes("--commit");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : null;

const TARGET_DB = config.databases.officers || "hicaddata";
const SOURCE_DB = process.env.MYSQL_DB_EMOLUMENT || "emolument";

const HASHED = new Set(["argon2", "identity", "md5"]);

function classify(passwordHash) {
  const fmt = detectFormat(passwordHash); // 'argon2'|'identity'|'md5'|'plaintext'|'unknown'
  const hashed = HASHED.has(fmt);
  return {
    format: passwordHash == null || passwordHash === "" ? "empty" : fmt,
    hashed,
    force_change: hashed ? 0 : 1,
  };
}

async function main() {
  console.log("─".repeat(72));
  console.log(`Password migration  (${COMMIT ? "COMMIT — WILL WRITE" : "DRY RUN — no writes"})`);
  console.log(`source: ${SOURCE_DB}.aspnetusers   ->   target: ${TARGET_DB}.hr_employees`);
  console.log(`join:   aspnetusers.UserName = hr_employees.Empl_ID`);
  if (LIMIT) console.log(`limit:  first ${LIMIT} source rows`);
  console.log("─".repeat(72));

  const conn = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    // no `database` — we fully-qualify every table name
    multipleStatements: false,
  });

  try {
    // 1. Preload existing Empl_IDs so we can tell matched vs unmatched without writing.
    const [empRows] = await conn.query(
      `SELECT Empl_ID FROM \`${TARGET_DB}\`.hr_employees`,
    );
    const emplIds = new Set(empRows.map((r) => String(r.Empl_ID).trim()));
    console.log(`hr_employees rows: ${emplIds.size}`);

    // 2. Read source rows.
    const [srcRows] = await conn.query(
      `SELECT Id, UserName, PasswordHash, FirstName, LastName, CreatedOn, UpdatedOn
         FROM \`${SOURCE_DB}\`.aspnetusers
        ${LIMIT ? `LIMIT ${LIMIT}` : ""}`,
    );
    console.log(`aspnetusers rows:  ${srcRows.length}`);
    console.log("─".repeat(72));

    // 2b. Group by UserName so we can see duplicate/junk keys clearly.
    const byUser = new Map(); // userId -> [rows]
    for (const row of srcRows) {
      const userId = row.UserName == null ? "" : String(row.UserName).trim();
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId).push(row);
    }
    const dupGroups = [...byUser.entries()].filter(([, rows]) => rows.length > 1);
    dupGroups.sort((a, b) => b[1].length - a[1].length);

    if (dupGroups.length) {
      console.log(`DUPLICATE UserNames: ${dupGroups.length} distinct values map to >1 row`);
      console.log("Top offenders (count | distinct names | distinct passwords | formats):");
      for (const [userId, rows] of dupGroups.slice(0, 15)) {
        const names = new Set(
          rows.map((r) => `${(r.FirstName || "").trim()}|${(r.LastName || "").trim()}`),
        );
        const pwds = new Set(rows.map((r) => r.PasswordHash));
        const fmts = new Set(rows.map((r) => classify(r.PasswordHash).format));
        console.log(
          `  ${String(userId || "(blank)").padEnd(14)} ${String(rows.length).padStart(5)} | ` +
            `${String(names.size).padStart(4)} names | ${String(pwds.size).padStart(4)} pwds | ${[...fmts].join(",")}`,
        );
      }
      // Full dup report to CSV for review.
      const dupFile = path.join(__dirname, "migratePasswords.duplicates.csv");
      const lines = ["UserName,rowCount,distinctNames,distinctPasswords,formats"];
      for (const [userId, rows] of dupGroups) {
        const names = new Set(rows.map((r) => `${(r.FirstName || "").trim()}|${(r.LastName || "").trim()}`));
        const pwds = new Set(rows.map((r) => r.PasswordHash));
        const fmts = new Set(rows.map((r) => classify(r.PasswordHash).format));
        lines.push(`"${userId}",${rows.length},${names.size},${pwds.size},"${[...fmts].join(" ")}"`);
      }
      fs.writeFileSync(dupFile, lines.join("\n") + "\n");
      console.log(`full duplicate report written to: ${dupFile}`);
      console.log("─".repeat(72));
    }

    // Helpers for dedup.
    const distinctNames = (rows) =>
      new Set(
        rows
          .map((r) => `${(r.FirstName || "").trim()}|${(r.LastName || "").trim()}`)
          .filter((n) => n !== "|"), // ignore fully-blank names
      );
    const pickWinner = (rows) =>
      rows.slice().sort((a, b) => {
        const ha = HASHED.has(detectFormat(a.PasswordHash)) ? 0 : 1;
        const hb = HASHED.has(detectFormat(b.PasswordHash)) ? 0 : 1;
        if (ha !== hb) return ha - hb; // hashed first
        const ua = +new Date(a.UpdatedOn || a.CreatedOn || 0);
        const ub = +new Date(b.UpdatedOn || b.CreatedOn || 0);
        if (ub !== ua) return ub - ua; // newest first
        return (b.Id || 0) - (a.Id || 0);
      })[0];

    // 3. Plan — one decision per UserName group.
    const tally = { argon2: 0, identity: 0, md5: 0, plaintext: 0, empty: 0, unknown: 0 };
    for (const row of srcRows) tally[classify(row.PasswordHash).format]++;

    let matched = 0, unmatched = 0, force0 = 0, force1 = 0;
    let junkKeys = 0, junkRows = 0, resolvedDupes = 0;
    const unmatchedList = [];
    const junkList = [];
    const junkForce = []; // junk Empl_IDs that exist in hr_employees -> force_change=1
    const updates = []; // { user_id, password, force_change }

    for (const [userId, rows] of byUser) {
      // Junk placeholder key: same UserName, multiple different people.
      if (rows.length > 1 && distinctNames(rows).size > 1) {
        junkKeys++;
        junkRows += rows.length;
        junkList.push(`"${userId}",${rows.length},${distinctNames(rows).size}`);
        if (userId && emplIds.has(userId)) junkForce.push(userId); // safety net
        continue; // excluded — needs name/email reconciliation
      }

      // Single row, or genuine same-person duplicate -> choose a winner.
      const winner = rows.length === 1 ? rows[0] : (resolvedDupes++, pickWinner(rows));
      const { force_change } = classify(winner.PasswordHash);

      if (!userId || !emplIds.has(userId)) {
        unmatched++;
        unmatchedList.push(`${winner.Id},${userId},${classify(winner.PasswordHash).format}`);
        continue;
      }
      matched++;
      if (force_change === 0) force0++; else force1++;
      updates.push({ user_id: userId, password: winner.PasswordHash, force_change });
    }

    // 4. Report.
    console.log("By stored format (all source rows):");
    for (const k of Object.keys(tally)) console.log(`  ${k.padEnd(10)} ${tally[k]}`);
    console.log("─".repeat(72));
    console.log(`EXCLUDED junk keys (>1 name): ${junkKeys} keys, ${junkRows} rows -> reconcile separately`);
    console.log(`resolved genuine dupes (1 name): ${resolvedDupes} groups -> hashed-first, newest wins`);
    console.log("─".repeat(72));
    console.log(`WILL UPDATE (matched Empl_IDs): ${matched}`);
    console.log(`  -> force_change = 0 (hashed):        ${force0}`);
    console.log(`  -> force_change = 1 (plain/empty):   ${force1}`);
    console.log(`unmatched (no Empl_ID):    ${unmatched}`);
    console.log(`junk Empl_IDs in hr_employees -> force_change=1: ${junkForce.length}`);
    console.log("─".repeat(72));

    if (unmatchedList.length) {
      const outFile = path.join(__dirname, "migratePasswords.unmatched.csv");
      fs.writeFileSync(outFile, "aspnetusers_Id,UserName,format\n" + unmatchedList.join("\n") + "\n");
      console.log(`unmatched rows written to: ${outFile}`);
    }
    if (junkList.length) {
      const jf = path.join(__dirname, "migratePasswords.junkkeys.csv");
      fs.writeFileSync(jf, "UserName,rowCount,distinctNames\n" + junkList.join("\n") + "\n");
      console.log(`excluded junk keys written to: ${jf}`);
    }

    if (!COMMIT) {
      console.log("\nDRY RUN complete — no rows changed. Re-run with --commit to apply.");
      return;
    }

    // 5a. BACKUP: snapshot the current state of every row we're about to touch,
    //     BEFORE any write, so it can be restored if needed.
    const affectedIds = [...new Set([...updates.map((u) => u.user_id), ...junkForce])];
    console.log(`\nBacking up current state of ${affectedIds.length} rows...`);
    const backup = [];
    const CHUNK = 1000;
    for (let i = 0; i < affectedIds.length; i += CHUNK) {
      const slice = affectedIds.slice(i, i + CHUNK);
      const placeholders = slice.map(() => "?").join(",");
      const [rows] = await conn.query(
        `SELECT Empl_ID, password, force_change FROM \`${TARGET_DB}\`.hr_employees WHERE Empl_ID IN (${placeholders})`,
        slice,
      );
      for (const r of rows) backup.push(r);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(__dirname, `migratePasswords.backup.${stamp}.csv`);
    const bLines = ["Empl_ID,password,force_change"];
    for (const r of backup) {
      const pw = r.password == null ? "" : String(r.password).replace(/"/g, '""');
      bLines.push(`"${r.Empl_ID}","${pw}",${r.force_change}`);
    }
    fs.writeFileSync(backupFile, bLines.join("\n") + "\n");
    console.log(`✅ Backup written (${backup.length} rows): ${backupFile}`);

    // 5b. Commit inside a single transaction.
    console.log(`\nApplying ${updates.length} password updates + ${junkForce.length} junk force_change...`);
    await conn.beginTransaction();
    const sql = `UPDATE \`${TARGET_DB}\`.hr_employees SET password = ?, force_change = ? WHERE Empl_ID = ?`;
    let done = 0;
    let affected = 0;
    for (const u of updates) {
      const [res] = await conn.execute(sql, [u.password, u.force_change, u.user_id]);
      affected += res.affectedRows || 0;
      if (++done % 1000 === 0) console.log(`  ...${done}/${updates.length}`);
    }
    // Junk safety net: force_change=1 only, password untouched.
    const junkSql = `UPDATE \`${TARGET_DB}\`.hr_employees SET force_change = 1 WHERE Empl_ID = ?`;
    let junkAffected = 0;
    for (const id of junkForce) {
      const [res] = await conn.execute(junkSql, [id]);
      junkAffected += res.affectedRows || 0;
    }
    await conn.commit();
    console.log(`✅ Commit done. password updates: ${affected} rows; junk force_change=1: ${junkAffected} rows`);
    console.log(`   Restore from: ${backupFile} if needed.`);
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error("❌ Migration failed (rolled back):", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
