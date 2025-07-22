import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA251ncX-8FZCDhvnY28RXyorNm0XkHhOo",
  authDomain: "tic-tac-toe-multiplayer-be22f.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-multiplayer-be22f-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-multiplayer-be22f",
  storageBucket: "tic-tac-toe-multiplayer-be22f.appspot.com",
  messagingSenderId: "916944110472",
  appId: "1:916944110472:web:2270cf7907a2aba085b03d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };