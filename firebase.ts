
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Kept for backward compatibility if needed, but not used for sheets anymore
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwgA2D0-p92P1SulckKzCbtyUlgiqL95s",
  authDomain: "ai-arena-c31cc.firebaseapp.com",
  projectId: "ai-arena-c31cc",
  storageBucket: "ai-arena-c31cc.firebasestorage.app",
  messagingSenderId: "312954759492",
  appId: "1:312954759492:web:e015d350461e33570a8f11",
  measurementId: "G-R7RPBTEGCC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Cloud Firestore
export const database = getDatabase(app); // Realtime Database
export const analytics = getAnalytics(app);
