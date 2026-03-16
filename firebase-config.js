// firebase-config.js - Shared Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAGDBKRUPTmp4RCMao2mnXfgfQmIp54to",
  authDomain: "paomobile-85e39.firebaseapp.com",
  projectId: "paomobile-85e39",
  storageBucket: "paomobile-85e39.firebasestorage.app",
  messagingSenderId: "844151679424",
  appId: "1:844151679424:web:0cfd6f491b79cd175ec025",
  measurementId: "G-BZYNZ9B9LQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
