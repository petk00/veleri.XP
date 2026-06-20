/**
 * Migracija: apsolutne file_path vrijednosti u Attachment tablici → relativne.
 *
 * Dry-run (bez promjena): node scripts/migrate-attachment-paths.js
 * Izvršavanje:            node scripts/migrate-attachment-paths.js --execute
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const db = require('../src/config/db');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../uploads');
const EXECUTE = process.argv.includes('--execute');

const toRelative = (filePath) => {
  // Already relative — no change needed.
  if (!path.isAbsolute(filePath)) return filePath;

  // Extract from 'attachments/' onward (portable across machines).
  const marker = 'attachments' + path.sep;
  const idx = filePath.indexOf(marker);
  if (idx === -1) {
    // Fallback: try path.relative against current UPLOADS_DIR.
    const rel = path.relative(UPLOADS_DIR, filePath);
    return rel.startsWith('..') ? null : rel;
  }
  return filePath.slice(idx);
};

async function main() {
  console.log(`Mode: ${EXECUTE ? 'EXECUTE' : 'DRY RUN'}`);
  console.log(`UPLOADS_DIR: ${UPLOADS_DIR}\n`);

  const [rows] = await db.query('SELECT id_attachment, file_path FROM Attachment');

  if (rows.length === 0) {
    console.log('Nema zapisa u Attachment tablici.');
    process.exit(0);
  }

  let needsMigration = 0;
  let alreadyRelative = 0;
  let unresolvable = 0;

  for (const row of rows) {
    const relative = toRelative(row.file_path);

    if (relative === null) {
      console.error(`[SKIP] id=${row.id_attachment} — ne mogu izračunati relativnu putanju: ${row.file_path}`);
      unresolvable++;
      continue;
    }

    if (relative === row.file_path) {
      console.log(`[OK]   id=${row.id_attachment} — već relativna: ${row.file_path}`);
      alreadyRelative++;
      continue;
    }

    console.log(`[MIGRATE] id=${row.id_attachment}`);
    console.log(`          Prije: ${row.file_path}`);
    console.log(`          Nakon: ${relative}`);

    if (EXECUTE) {
      await db.query('UPDATE Attachment SET file_path = ? WHERE id_attachment = ?', [relative, row.id_attachment]);
      console.log(`          [UPDATED]`);
    }

    needsMigration++;
  }

  console.log(`\nSažetak:`);
  console.log(`  Već relativnih: ${alreadyRelative}`);
  console.log(`  Za migraciju:   ${needsMigration}`);
  console.log(`  Neriješivih:    ${unresolvable}`);

  if (!EXECUTE && needsMigration > 0) {
    console.log(`\nPokreni s --execute zastavom za primjenu promjena.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Greška:', err);
  process.exit(1);
});
