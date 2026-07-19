import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Helper to generate initials avatar URL
export const getInitialsAvatar = (name) => {
  const parts = (name || '').trim().split(/\s+/);
  const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'U')}&background=5f35f5&color=fff&bold=true`;
};

// Sign Up
export const signUpUser = async (fullName, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const photoURL = getInitialsAvatar(fullName);

  const userDoc = {
    uid: user.uid,
    fullName,
    email,
    photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Create Firestore document in 'users' collection
  try {
    await setDoc(doc(db, "users", user.uid), userDoc);
  } catch (err) {
    console.error("Error setting user document in Firestore:", err, err.stack);
    throw err;
  }
  return userDoc;
};

// Sign In
export const signInUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Google Sign-In
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if user exists in firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    const newDoc = {
      uid: user.uid,
      fullName: user.displayName || 'Google User',
      email: user.email,
      photoURL: user.photoURL || getInitialsAvatar(user.displayName || 'Google User'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userDocRef, newDoc);
    return newDoc;
  }

  return userDocSnap.data();
};

// Sign Out
export const signOutUser = async () => {
  await signOut(auth);
};

// Forgot Password / Password Reset
export const sendPasswordReset = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
