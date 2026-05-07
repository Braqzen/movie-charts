import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const USER_FILE_RE = /^user(\d+)\.json$/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const usersDir = path.join(root, "users");
const moviesPath = path.join(root, "movies.json");

function parseCli(argv) {
  let write = false;
  const positionals = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write" || a === "-w") write = true;
    else if (a.startsWith("-")) {
      console.error(`Unknown option: ${a}`);
      printUsage();
      process.exit(1);
    } else positionals.push(a);
  }
  const countRaw = positionals[0];
  const n = countRaw == null ? NaN : Number(countRaw);
  if (!Number.isInteger(n) || n < 1) {
    printUsage();
    process.exit(1);
  }
  return { count: n, write };
}

function printUsage() {
  console.error(
    "Usage: node scripts/create-users.mjs <count> [--write|-w]\n" +
      "  Default: dry run (prints JSON only). Add --write to create files.",
  );
}

function ensureUsersDir() {
  if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir, { recursive: true });
}

function maxNumericUserSuffix() {
  if (!fs.existsSync(usersDir)) return 0;
  let max = 0;
  for (const name of fs.readdirSync(usersDir)) {
    const m = USER_FILE_RE.exec(name);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

function loadMovieIds() {
  const raw = fs.readFileSync(moviesPath, "utf8");
  const catalog = JSON.parse(raw);
  if (!Array.isArray(catalog)) throw new Error("movies.json must be an array");
  return catalog.map((row) => row.id);
}

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickRandomRating() {
  return RATING_STEPS[randomIntInclusive(0, RATING_STEPS.length - 1)];
}

function randomLikeForRating(rating) {
  if (rating < 4) return false;
  return Math.random() < 0.4;
}

/** Fisher-Yates slice: shuffle copy and take first k */
function sampleUniqueIds(ids, k) {
  const pool = [...ids];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, k)
    .slice()
    .sort((a, b) => a - b);
}

function buildUserRows(movieIds) {
  const k = randomIntInclusive(3, 50);
  if (movieIds.length < k) {
    throw new Error(`Need at least ${k} movies in catalog, have ${movieIds.length}`);
  }
  const picked = sampleUniqueIds(movieIds, k);
  return picked.map((id) => {
    const rating = pickRandomRating();
    return { id, rating, like: randomLikeForRating(rating) };
  });
}

function formatPayload(rows) {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

function writeUserFile(index, rows) {
  const filename = `user${index}.json`;
  const dest = path.join(usersDir, filename);
  fs.writeFileSync(dest, formatPayload(rows), "utf8");
  return dest;
}

function main() {
  const { count, write: doWrite } = parseCli(process.argv);
  const movieIds = loadMovieIds();
  let next = maxNumericUserSuffix() + 1;

  if (!doWrite) {
    console.log(`Dry run (${count} user file(s), next index N=${next}). No files written.\n`);
  } else {
    ensureUsersDir();
    console.log(`Writing ${count} user file(s) starting at user${next}.json\n`);
  }

  for (let i = 0; i < count; i++) {
    const rows = buildUserRows(movieIds);
    const filename = `user${next}.json`;
    const dest = path.join(usersDir, filename);
    if (doWrite) {
      writeUserFile(next, rows);
      console.log(dest);
    } else {
      console.log(`${dest}\n${formatPayload(rows)}`);
    }
    next += 1;
  }

  if (!doWrite) {
    console.log("Pass --write or -w to create these files.");
  }
}

main();
