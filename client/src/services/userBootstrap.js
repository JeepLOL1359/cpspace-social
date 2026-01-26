import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, collection, serverTimestamp } from "firebase/firestore";

export async function bootstrapUser(uid, pseudonym) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  // 1. Create root user document ONLY if it doesn't exist
  if (!snap.exists()) {
    await setDoc(userRef, {
      createdAt: serverTimestamp(),
      userName: "",
      pseudonym,
      activeStatus: "active",
      roles: ["user"],

      preferences: {
        theme: "light",
        colorPalette: "blue",
        chatbotTone: "default",
        autoPersonalisation: true,
        revealToFamiliarity: true,
        notifyOnConsent: true,
        enableDMRequests: true,
        contentFilters: true,
        language: "en",
        feelings: {
          added: { pos: [], neu: [], neg: [] },
          removed: { pos: [], neu: [], neg: [] }
        }
      },

      blockedUsers: []
    });
  }

  // 2. diaries/meta (safe to merge)
  await setDoc(
    doc(collection(userRef, "diaries"), "meta"),
    {
      createdAt: serverTimestamp(),
      totalEntries: 0,
      lastEntryAt: null
    },
    { merge: true }
  );

  // 3. chatbotConversations/meta
  await setDoc(
    doc(collection(userRef, "chatbotConversations"), "meta"),
    {
      createdAt: serverTimestamp(),
      totalConversations: 0,
      lastUsedAt: null
    },
    { merge: true }
  );

  // 4. assessments/meta
  await setDoc(
    doc(collection(userRef, "assessments"), "meta"),
    {
      createdAt: serverTimestamp(),
      completed: [],
      lastCompletedAt: null
    },
    { merge: true }
  );
}
