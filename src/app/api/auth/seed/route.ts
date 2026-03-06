import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = "force-dynamic";

export async function POST() {
    const results: any[] = [];

    // Manifest of users to seed (matching db/seed)
    const usersToSeed = [
        { id: 'user-medroc-fac-1', email: 'abebe@medroc.com', name: 'Abebe Bikila', role: 'FACILITATOR' },
        { id: 'user-medroc-fellow-1', email: 'selam@selam.com', name: 'Selam Tesfaye', role: 'FELLOW' },
        { id: 'admin-ayebesufkad', email: 'ayebesufkad@gmail.com', name: 'Ayebe Sufkad', role: 'ADMIN' },
        { id: 'admin-amaretsigu', email: 'amaretsigu@gmail.com', name: 'Amare Tsigu', role: 'ADMIN' },
        { id: 'admin-gemechu', email: 'gemechu@icapitalafrica.org', name: 'Gemechu', role: 'ADMIN' },
        { id: 'admin-yeabsirasemu', email: 'yeabsirasemu4@gmail.com', name: 'Yeabsira Semu', role: 'ADMIN' }
    ];

    try {
        for (const profile of usersToSeed) {
            try {
                // 1. Create or get user in Auth
                let userRecord;
                try {
                    userRecord = await adminAuth.getUserByEmail(profile.email);
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        userRecord = await adminAuth.createUser({
                            uid: profile.id,
                            email: profile.email,
                            password: profile.role === 'ADMIN' ? 'ldbpassword123!' : 'Password123!',
                            displayName: profile.name,
                        });
                    } else {
                        throw e;
                    }
                }

                // 2. Set Custom Claims
                await adminAuth.setCustomUserClaims(userRecord.uid, { role: profile.role });

                // 3. Sync to Firestore
                await adminDb.collection('users').doc(userRecord.uid).set({
                    ...profile,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                results.push({ email: profile.email, status: 'success' });
            } catch (err: any) {
                results.push({ email: profile.email, status: 'error', message: err.message });
            }
        }

        return NextResponse.json({ message: 'Auth seeding completed', results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
