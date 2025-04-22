// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBjOOYn8kASgtYwEznDpYLlbVhwuO8W3YY",
    authDomain: "virtual-stylist-26ea4.firebaseapp.com",
    projectId: "virtual-stylist-26ea4",
    storageBucket: "virtual-stylist-26ea4.firebasestorage.app",
    messagingSenderId: "502633226086",
    appId: "1:502633226086:web:0c7c7edd45e8cc90f2f2a7",
    measurementId: "G-FV0FTRKLMQ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
