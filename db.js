// db.js - Firebase Modular SDK (Auth, Firestore, Analytics)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc, orderBy, setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAGDBKRUPTmp4RCMao2mnXfgfQmIp54to",
  authDomain: "paomobile-85e39.firebaseapp.com",
  projectId: "paomobile-85e39",
  storageBucket: "paomobile-85e39.firebasestorage.app",
  messagingSenderId: "844151679424",
  appId: "1:844151679424:web:0cfd6f491b79cd175ec025",
  measurementId: "G-BZYNZ9B9LQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Export for use in other modules
window.db = db;
window.auth = auth;
window.analytics = analytics;
window.firestore = {
    collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc, orderBy, setDoc
};
window.firebaseAuth = {
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendEmailVerification
};

console.log("Firebase Services Initialized (Auth, Firestore, Analytics)");
