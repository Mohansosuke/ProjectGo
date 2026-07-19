import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYpnB_-zgHIypK_7BjXOSrZ1eL4ib4j94",
  authDomain: "taskmanagement-2609b.firebaseapp.com",
  projectId: "taskmanagement-2609b",
  storageBucket: "taskmanagement-2609b.firebasestorage.app",
  messagingSenderId: "131560430517",
  appId: "1:131560430517:web:daaeb81c20b208700d97fc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
