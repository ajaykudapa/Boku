// src/utils/firebase.js
// --------------------------------------------------
// Re‑export the already‑initialized Realtime Database
// so components can simply do:
//   import { db } from "../utils/firebase";
//
// If you haven’t created src/firebase/config.js yet,
// copy the full initializeApp snippet there first
// (see below for reference).
// --------------------------------------------------

export { db } from "../firebase/config";
