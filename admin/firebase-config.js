// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuceRc2cKcZCSAXJnq1i-dGxBazcMHy-8",
  authDomain: "kafi-abdullah-portfolio.firebaseapp.com",
  projectId: "kafi-abdullah-portfolio",
  storageBucket: "kafi-abdullah-portfolio.firebasestorage.app",
  messagingSenderId: "888081919366",
  appId: "1:888081919366:web:a0edf5b778e5d7334a1007",
  measurementId: "G-PHRH3HYWJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);