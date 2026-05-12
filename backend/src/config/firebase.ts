import fs from "node:fs";
import path from "node:path";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { env } from "./env.js";

function firebaseCredential() {
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const candidates = [
      path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH),
      path.resolve(process.cwd(), "..", env.FIREBASE_SERVICE_ACCOUNT_PATH)
    ];
    const serviceAccountPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!serviceAccountPath) {
      throw new Error(`Firebase service account file not found: ${env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key
    });
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
  }

  return applicationDefault();
}

if (!getApps().length) {
  initializeApp({
    credential: firebaseCredential(),
    projectId: env.FIREBASE_PROJECT_ID
  });
}

export const db = getFirestore();
export { FieldValue, Timestamp };
