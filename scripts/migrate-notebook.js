/**
 * One-shot migration script: reads all notebook entries from Firebase and 
 * lists users, then pushes any missing entries.
 * Run: node scripts/migrate-notebook.js
 */
const admin = require('../node_modules/firebase-admin');
const fs = require('fs');

const sa = JSON.parse(fs.readFileSync('/tmp/edgevault_sa.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function main() {
  // Find all users
  const usersSnap = await db.collection('users').listDocuments();
  console.log(`Found ${usersSnap.length} user(s)`);

  for (const userRef of usersSnap) {
    const uid = userRef.id;
    console.log(`\n=== User: ${uid} ===`);

    // Check dailyNotes
    const dailySnap = await db.collection(`users/${uid}/dailyNotes`).get();
    console.log(`  dailyNotes: ${dailySnap.size} docs`);
    dailySnap.forEach(d => {
      const data = d.data();
      if (data.title) console.log(`    [NEW FORMAT] ${d.id}: ${data.title}`);
      else if (data.date) console.log(`    [OLD FORMAT] ${d.id}: ${data.date}`);
      else console.log(`    [UNKNOWN] ${d.id}:`, Object.keys(data));
    });

    // Check customNotes
    const customSnap = await db.collection(`users/${uid}/customNotes`).get();
    console.log(`  customNotes: ${customSnap.size} docs`);
    
    // Check notebookEntries (old collection)
    const nbSnap = await db.collection(`users/${uid}/notebookEntries`).get();
    console.log(`  notebookEntries (old): ${nbSnap.size} docs`);
    
    // Migrate notebookEntries -> dailyNotes (if any exist)
    if (nbSnap.size > 0) {
      console.log(`  Migrating ${nbSnap.size} notebookEntries -> dailyNotes...`);
      const batch = db.batch();
      nbSnap.forEach(d => {
        const ref = db.doc(`users/${uid}/dailyNotes/${d.id}`);
        batch.set(ref, d.data(), { merge: true });
      });
      await batch.commit();
      console.log(`  Migration done!`);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
