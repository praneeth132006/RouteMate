import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE_THpgnH6pa13JUdG0I8d0oj8nwkYfyE",
  authDomain: "tripnest-83101.firebaseapp.com",
  databaseURL: "https://tripnest-83101-default-rtdb.firebaseio.com",
  projectId: "tripnest-83101",
  storageBucket: "tripnest-83101.firebasestorage.app",
  messagingSenderId: "938812065684",
  appId: "1:938812065684:web:20883d2f408fab6421781a"
};

let app;
let auth;
let database;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

export { auth, database };
export default app;
