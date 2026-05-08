import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLmMdtsisjr_5LfgK5YfbqNUHwwysj0Uk",
  authDomain: "uniconnect-ayu.firebaseapp.com",
  projectId: "uniconnect-ayu",
  storageBucket: "uniconnect-ayu.firebasestorage.app",
  messagingSenderId: "1082434380661",
  appId: "1:1082434380661:web:0f0a98756d98365e37a93c",
  measurementId: "G-B4QBW2JDS4",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

googleProvider.setCustomParameters({ prompt: "select_account" });
appleProvider.addScope("email");
appleProvider.addScope("name");
