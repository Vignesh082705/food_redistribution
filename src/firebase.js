// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth,sendSignInLinkToEmail,isSignInWithEmailLink, signInWithEmailLink  } from "firebase/auth";
import { getFirestore,doc,updateDoc } from "firebase/firestore";
import { getDatabase,push,ref,get,set,onValue,update,remove, query, orderByChild } from "firebase/database"; // Import Realtime Database
import { fetchSignInMethodsForEmail } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRJOh-PmQCzZN6BPrgjZ23M0vOjEDImUI",
  authDomain: "food-redistribution-595ee.firebaseapp.com",
  databaseURL: "https://food-redistribution-595ee-default-rtdb.firebaseio.com/", // Add your Realtime Database URL
  projectId: "food-redistribution-595ee",
  storageBucket: "food-redistribution-595ee.appspot.com",
  messagingSenderId: "696199276840",
  appId: "1:696199276840:web:d740a10b19f44443cc081d",
  measurementId: "G-5BVSBV77MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const getUserProfile = async (uid, role) => {
  if (!role) return null;

  const userRef = ref(database, `${role.toLowerCase()}/${uid}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No user data available");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app); // Initialize Realtime Database

export { app,auth,db,database,getDatabase,set,get,ref,onValue,update,remove,push,sendSignInLinkToEmail,doc,updateDoc, 
  isSignInWithEmailLink, signInWithEmailLink, fetchSignInMethodsForEmail, query, orderByChild};