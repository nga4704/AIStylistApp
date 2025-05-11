// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCiPNSytd0fErL7Xr_Qb2E7kydMRMQ8xkI",
  authDomain: "shopkart-d0c9f.firebaseapp.com",
  databaseURL: "https://shopkart-d0c9f-default-rtdb.firebaseio.com",
  projectId: "shopkart-d0c9f",
  storageBucket: "shopkart-d0c9f.appspot.com",
  messagingSenderId: "1085408768941",
  appId: "1:1085408768941:web:5bb7d52f516f8b9b2e6724",
  measurementId: "G-VEHELXYRQD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
