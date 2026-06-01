import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";

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
const analytics = getAnalytics(app);

// Enable Offline Persistence for all users
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Firestore Persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code == 'unimplemented') {
      console.warn("Firestore Persistence: The current browser doesn't support all of the features required to enable persistence.");
    }
  });
}

export { auth, db, analytics };
