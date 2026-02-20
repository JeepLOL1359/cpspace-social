// client/src/services/userBootstrap.js

import { db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collectionGroup,
  query,
  where,
  getDocs
} from "firebase/firestore";

/**
 * Generate random numeric discriminator (Discord-style)
 */
function generateDiscriminator() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate public friend UID (opaque, game-style)
 */
function generatePublicUid(length = 12) {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(values)
    .map((x) => charset[x % charset.length])
    .join('');
}

/**
 * Generate default pseudonym (anonymous, human-readable)
 */
function generatePseudonym() {
  const adjectives = [
    "Quiet", "Silent", "Calm", "Lost", "Gentle",
    "Hidden", "Ethereal", "Vivid", "Misty", "Lunar",
    "Cold", "Amber", "Velvet", "Swift", "Radiant"
  ];

  const nouns = [
    "Fox", "Owl", "Wolf", "Whale", "Raven",
    "Lynx", "Deer", "Ghost", "Storm", "Orbit",
    "Pulse", "Cedar", "Echo", "Siren", "Panda"
  ];

  const suffix = Math.floor(1000 + Math.random() * 9000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}${suffix}`;
}

async function generateUniquePublicUid() {
  let unique = false;
  let newUid;
  let attempts = 0;

  while (!unique) {
    attempts++;
    newUid = generatePublicUid();

    console.log(`🔁 Checking publicUID attempt ${attempts}:`, newUid);

    const q = query(
      collectionGroup(db, "publicProfile"),
      where("publicUID", "==", newUid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      unique = true;
      console.log("✅ publicUID is unique");
    } else {
      console.log("⚠️ Collision detected, regenerating...");
    }
  }

  return newUid;
}

export async function bootstrapUser(firebaseUid) {
  console.log("🚀 bootstrapUser START for:", firebaseUid);

  try {
    const userRef = doc(db, "users", firebaseUid);
    const publicProfileRef = doc(
      db,
      "users",
      firebaseUid,
      "publicProfile",
      "profile"
    );

    console.log("🔎 Checking if root user exists...");
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      console.log("⚠️ Root user already exists. Bootstrap exiting.");
      return;
    }

    console.log("🆕 Creating new user...");

    const pseudonym = generatePseudonym();
    const discriminator = generateDiscriminator();

    console.log("🎲 Generated pseudonym:", pseudonym);
    console.log("🎲 Generated discriminator:", discriminator);

    console.log("🔍 Generating unique publicUID...");
    const publicUid = await generateUniquePublicUid();
    console.log("✅ Unique publicUID generated:", publicUid);

    console.log("📄 Writing PRIVATE user document...");
    await setDoc(userRef, {
      firebaseID: firebaseUid,
      createdAt: serverTimestamp(),

      activeStatus: "active",
      roles: ["user"],

      preferences: {
        theme: "light",
        colorPalette: "default",
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

    console.log("✅ PRIVATE user document written");

    console.log("📄 Writing PUBLIC profile document...");
    await setDoc(publicProfileRef, {
      uid: firebaseUid,
      publicUID: publicUid,
      pseudonym,
      username: {
        value: pseudonym,
        discriminator
      },
      createdAt: serverTimestamp()
    });

    console.log("✅ PUBLIC profile document written");
    console.log("🎉 bootstrapUser COMPLETED successfully");

  } catch (error) {
    console.error("❌ bootstrapUser FAILED:", error);
  }
}