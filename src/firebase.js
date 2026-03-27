import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 apiKey: "AIzaSyAlU2-hAqJlDmQDOlcN0xVjD67ip98F2a4",
  authDomain: "hydrauliqu-e3d88.firebaseapp.com",
  projectId: "hydrauliqu-e3d88",
  storageBucket: "hydrauliqu-e3d88.firebasestorage.app",
  messagingSenderId: "250593788129",
  appId: "1:250593788129:web:382d819c229ed839c577a0",
  measurementId: "G-ME5W61S2QG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);