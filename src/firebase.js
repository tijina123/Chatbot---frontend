import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Add this import

const firebaseConfig = {
  apiKey: "AIzaSyDvupm_5DlJMn-GxO30CJe917JPANZk27c",
  authDomain: "doha-explorer.firebaseapp.com",
  projectId: "doha-explorer",
  storageBucket: "doha-explorer.firebasestorage.app",
  messagingSenderId: "640143100050",
  appId: "1:640143100050:web:a626843a140ef90840fe4b",
  measurementId: "G-2NJKBRM83L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const db = getFirestore(app); // 2. Add this export
// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// --- CHECK THESE EXPORTS CAREFULLY ---
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);