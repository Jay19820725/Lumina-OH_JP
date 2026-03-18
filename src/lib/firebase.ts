import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug check for missing configuration
if (import.meta.env.PROD && !firebaseConfig.apiKey) {
  console.error(
    "Firebase Configuration Error: apiKey is missing. " +
    "Ensure environment variables are set BEFORE building the application."
  );
}

// Initialize Firebase
let app;
let auth: any;
let storage: any;

try {
  const isConfigValid = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "undefined" && 
    firebaseConfig.appId && 
    firebaseConfig.appId !== "undefined";

  if (isConfigValid) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
  } else {
    console.warn("Firebase: Missing configuration (apiKey or appId). Authentication features will be disabled.");
    // Mock objects to prevent crashes
    auth = { onAuthStateChanged: (cb: any) => { cb(null); return () => {}; } };
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  auth = { onAuthStateChanged: (cb: any) => { cb(null); return () => {}; } };
}

// Initialize Analytics
let analytics: any = null;
if (typeof window !== "undefined" && app) {
  isSupported().then((supported) => {
    if (supported && app) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, storage, analytics };
