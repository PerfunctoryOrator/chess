import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "./config/firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

signInAnonymously(auth)
    .then(() => console.log("Signed in anonymously"))
    .catch((error) => console.error("Auth error:", error));
