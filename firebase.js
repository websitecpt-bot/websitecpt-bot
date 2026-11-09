import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// আপনার ফায়ারবেস অ্যাপের কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyAc_laF-_pWwFo-4HWMAvg2-gHStbBUJB",
  authDomain: "websitecpt-bot.firebaseapp.com",
  projectId: "websitecpt-bot",
  storageBucket: "websitecpt-bot.firebasestorage.app",
  messagingSenderId: "656996348352",
  appId: "1:656996348352:web:7ad18dd381a87c841fa025",
  measurementId: "G-S2CJQ8CG1R"
};

// ফায়ারবেস ইনিশিয়ালাইজ করা
const app = initializeApp(firebaseConfig);

// এগুলো আপনার লগইন (Auth) এবং ডাটাবেস (Firestore) এর জন্য লাগবে
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
