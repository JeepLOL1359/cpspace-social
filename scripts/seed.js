import admin from "firebase-admin";
admin.initializeApp();

const db = admin.firestore();

await db.collection("posts").add({
  authorId: "u123",
  body: "Hello",
  emotionCategory: "unpleasant",
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
