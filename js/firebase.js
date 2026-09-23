/*
  PUBLIC WEBSITE FIREBASE CONNECTION
  ----------------------------------
  1. Copy your Firebase web app config into ../admin/firebase-config.js
  2. This file imports that config.
  3. Firestore collections used:
       projects
       posts
  4. Only documents with published == true are shown publicly.

  IMPORTANT: Firebase Web API keys are not secret. Your Firestore Security
  Rules are what protect the database. Never put a Firebase Admin SDK
  service-account JSON file in this website.
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { firebaseConfig } from "../admin/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function loadProjects(){
  try{
    const q=query(collection(db,"projects"),where("published","==",true),orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(err){
    console.warn("Firebase projects unavailable:",err);
    return [];
  }
}
export async function loadPosts(){
  try{
    const q=query(collection(db,"posts"),where("published","==",true),orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(err){
    console.warn("Firebase posts unavailable:",err);
    return [];
  }
}
