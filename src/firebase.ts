  // src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA_bglKDmbXnq-Q2YkwMFHPSO6WHch1fdc",
    authDomain: "snail-racing-30d9f.firebaseapp.com",
    projectId: "snail-racing-30d9f",
    storageBucket: "snail-racing-30d9f.firebasestorage.app",
    messagingSenderId: "878899655550",
    appId: "1:878899655550:web:be36a4c810fa51b94eb92f"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Sign in anonymously on load
signInAnonymously(auth).catch(console.error);
