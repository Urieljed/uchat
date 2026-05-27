// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🔥 CONFIGURATION FIREBASE — À REMPLIR
//  1. Va sur https://console.firebase.google.com
//  2. Crée un projet "uchat"
//  3. Ajoute une app Web et copie ta config ici
//  4. Active Authentication > Phone (ou Email/Password)
//  5. Active Firestore Database (mode test au départ)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDTIVbRCIlxU3OsayOxD-LwjjzTd5ovT48",
  authDomain: "uchat-fc773.firebaseapp.com",
  projectId: "uchat-fc773",
  storageBucket: "uchat-fc773.firebasestorage.app",
  messagingSenderId: "99707957796",
  appId: "1:99707957796:web:53770d478b9c59cf559eb1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
