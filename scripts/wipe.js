import admin from "firebase-admin";
import serviceAccount from "../firebase/serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/*node scripts/wipe.js*/

const db = admin.firestore();

/* ============================
   HELPERS
   ============================ */

async function deleteCollection(query, batchSize = 50) {
  let snapshot = await query.limit(batchSize).get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  // Recursively continue
  await deleteCollection(query, batchSize);
}

async function deleteSubcollection(parentRef, subcollectionName) {
  const subRef = parentRef.collection(subcollectionName);
  const snapshot = await subRef.get();

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
}

/* ============================
   WIPE LOGIC
   ============================ */

async function wipe() {
  console.log("🔥 Starting database wipe...");

  const usersSnap = await db.collection("users").get();

  /* ---- USERS → ALL SUBCOLLECTIONS ---- */
  for (const user of usersSnap.docs) {
    // diaries
    await deleteSubcollection(user.ref, "diaries");

    // assessments
    await deleteSubcollection(user.ref, "assessments");

    // chatbot conversations → messages → convo docs
    const chatbotSnap = await user.ref
      .collection("chatbotConversations")
      .get();

    for (const convo of chatbotSnap.docs) {
      await deleteSubcollection(convo.ref, "messages");
      await convo.ref.delete();
    }
  }

  console.log("✅ User subcollections wiped");

  /* ---- POSTS → COMMENTS ---- */
  const postsSnap = await db.collection("posts").get();
  for (const post of postsSnap.docs) {
    await deleteCollection(
      db.collection("posts").doc(post.id).collection("comments")
    );
    await post.ref.delete();
  }
  console.log("✅ Posts & comments wiped");

  /* ---- CONVERSATIONS → MESSAGES ---- */
  const convosSnap = await db.collection("conversations").get();
  for (const convo of convosSnap.docs) {
    await deleteCollection(
      db.collection("conversations").doc(convo.id).collection("messages")
    );
    await convo.ref.delete();
  }
  console.log("✅ Conversations & messages wiped");

  /* ---- DEFAULT FEELINGS ---- */
  const defaultFeelingsRef = db.collection("defaultFeelings").doc("default");
  const exists = await defaultFeelingsRef.get();
  if (exists.exists) {
    await defaultFeelingsRef.delete();
    console.log("✅ defaultFeelings wiped");
  }

  /* ---- USERS (LAST, ALWAYS LAST) ---- */
  for (const user of usersSnap.docs) {
    await user.ref.delete();
  }
  console.log("✅ Users wiped");

  console.log("🎉 WIPE COMPLETE");
}

/* ============================
   RUN
   ============================ */

wipe()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  });
