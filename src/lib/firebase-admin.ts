import * as admin from "firebase-admin";

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let isFirebaseAdminConfigured = false;
let serviceAccount = null;

if (serviceAccountStr) {
  try {
    serviceAccount = JSON.parse(serviceAccountStr);
    isFirebaseAdminConfigured = true;
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", e);
  }
}

if (isFirebaseAdminConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export const adminDb = isFirebaseAdminConfigured ? admin.firestore() : null;
export const adminAuth = isFirebaseAdminConfigured ? admin.auth() : null;
export { isFirebaseAdminConfigured };
