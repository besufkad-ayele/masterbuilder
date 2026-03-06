import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
    if (projectId && clientEmail && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Firebase admin initialization error', error);
        }
    } else {
        console.warn('Firebase Admin credentials not found. Skipping initialization.');
    }
}

// Export specialized instances
// Note: These will fail at runtime if accessed and not initialized, 
// but they won't crash the module import during build.
const getAdminAuth = () => admin.auth();
const getAdminDb = () => admin.firestore();
const getAdminStorage = () => admin.storage();

export const adminAuth = admin.apps.length > 0 ? admin.auth() : ({} as admin.auth.Auth);
export const adminDb = admin.apps.length > 0 ? admin.firestore() : ({} as admin.firestore.Firestore);
export const adminStorage = admin.apps.length > 0 ? admin.storage() : ({} as admin.storage.Storage);

export { admin as default };
