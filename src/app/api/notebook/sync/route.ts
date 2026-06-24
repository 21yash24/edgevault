import { NextResponse } from "next/server";
import { adminDb, adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured || !adminDb || !adminAuth) {
      return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await request.json();
    
    // We expect { action: 'batchUpdate', entries: NotebookEntry[] } or { action: 'delete', id: string }
    const { action, entries, entry, id } = body;

    if (action === 'delete' && id) {
       await adminDb.doc(`users/${uid}/dailyNotes/${id}`).delete();
       return NextResponse.json({ success: true });
    }

    if (action === 'save' && entry) {
       await adminDb.doc(`users/${uid}/dailyNotes/${entry.id}`).set(entry, { merge: true });
       return NextResponse.json({ success: true });
    }

    if (action === 'batchUpdate' && Array.isArray(entries)) {
       const batch = adminDb.batch();
       for (const e of entries) {
         const docRef = adminDb.doc(`users/${uid}/dailyNotes/${e.id}`);
         batch.set(docRef, e, { merge: true });
       }
       await batch.commit();
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action payload" }, { status: 400 });
  } catch (error: any) {
    console.error("Notebook API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
