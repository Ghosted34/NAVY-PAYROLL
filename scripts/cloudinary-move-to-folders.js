// Put emolument photos into Media Library folders on Cloudinary.
//
// On a "dynamic folders" Cloudinary account an image named
// emolument/passport/nn_12345 can still sit in Home: the slashes are only part of
// its name (public_id). This script lists every image whose name starts with
// the prefix and sets its folder (asset_folder) to the name minus the last part:
//   emolument/passport/nn_12345   ->  folder emolument/passport
// Only the folder changes. public_id, URLs and ef_documents stay as they are.
//
//   node scripts/cloudinary-move-to-folders.js                    dry run
//   node scripts/cloudinary-move-to-folders.js --apply            move them
//   node scripts/cloudinary-move-to-folders.js --prefix emolument/pass --apply
//   node scripts/cloudinary-move-to-folders.js --apply --wait   keep going: wait out
//                                                               the hourly limit, then continue
//
// Safe to run again: images already in the right folder are skipped. If
// Cloudinary's hourly API limit is reached it stops; run it again later.
// Needs CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.

require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : null;
};
const APPLY = process.argv.includes("--apply");
const PREFIX = arg("--prefix") || "emolument/";
const WAIT = process.argv.includes("--wait");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const folderFor = (publicId) => (publicId.includes("/") ? publicId.slice(0, publicId.lastIndexOf("/")) : "");
const isRateLimit = (e) => (e.error && e.error.http_code === 420) || /rate limit/i.test(e.message || (e.error && e.error.message) || "");

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary settings missing (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).");
  }
  console.log(`Images whose name starts with "${PREFIX}". ${APPLY ? "Moving." : "Dry run (add --apply)."}\n`);

  // 1. list (500 per call)
  const all = [];
  let cursor;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: PREFIX,
      max_results: 500,
      next_cursor: cursor,
    });
    all.push(...page.resources);
    cursor = page.next_cursor;
    if (page.rate_limit_remaining != null) process.stdout.write(`  listed ${all.length} (API calls left this hour: ${page.rate_limit_remaining})\r`);
  } while (cursor);
  console.log(`\n${all.length} image(s) found.`);

  const todo = all.filter((r) => (r.asset_folder || "") !== folderFor(r.public_id));
  const byFolder = {};
  for (const r of todo) {
    const k = `${r.asset_folder || "(Home)"}  ->  ${folderFor(r.public_id)}`;
    byFolder[k] = (byFolder[k] || 0) + 1;
  }
  console.log(`${all.length - todo.length} already in the right folder, ${todo.length} to move:`);
  for (const [k, n] of Object.entries(byFolder)) console.log(`  ${n}  ${k}`);
  if (!APPLY || !todo.length) return;

  // 2. move (one API call per image)
  let moved = 0, failed = 0, stopped = false;
  for (let i = 0; i < todo.length && !stopped; i++) {
    const r = todo[i];
    try {
      await cloudinary.api.update(r.public_id, { resource_type: "image", type: "upload", asset_folder: folderFor(r.public_id) });
      moved++;
      if (moved % 100 === 0) console.log(`  ${new Date().toLocaleTimeString()}  moved ${moved} / ${todo.length}`);
    } catch (e) {
      if (isRateLimit(e)) {
        if (!WAIT) {
          console.log(`\nCloudinary's hourly API limit reached after ${moved}. Run the same command again later to continue.`);
          stopped = true;
        } else {
          console.log(`  ${new Date().toLocaleTimeString()}  hourly limit reached (${moved} moved so far); waiting 10 minutes`);
          await sleep(10 * 60 * 1000);
          i--; // try the same image again
        }
        continue;
      }
      failed++;
      console.log(`  ${r.public_id}: ${e.message || (e.error && e.error.message)}`);
    }
  }
  console.log(`\nMoved ${moved}, errors ${failed}, left ${todo.length - moved - failed}.`);
}

main().catch((e) => {
  console.error("❌", e.message || (e.error && e.error.message) || e);
  process.exit(1);
});
