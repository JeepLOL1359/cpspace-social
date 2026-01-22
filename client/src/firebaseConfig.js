// client/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace with YOUR Firebase config (from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyBM32ltj6MOpr7Dqr-2uqKI-y6gNijouEU",
    authDomain: "cpspace.firebaseapp.com",
    projectId: "cpspace",
    storageBucket: "cpspace.firebasestorage.app",
    messagingSenderId: "118287740412",
    appId: "1:118287740412:web:d6a36e8e6dbf23ee2a1679"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
