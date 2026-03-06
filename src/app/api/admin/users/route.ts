import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { email, name, role, password, title } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
        }

        // 1. Check if user already exists in Auth
        try {
            const existingUser = await adminAuth.getUserByEmail(email);
            if (existingUser) {
                return NextResponse.json({
                    error: 'user-already-exists',
                    message: 'User already registered'
                }, { status: 409 });
            }
        } catch (authError: any) {
            // auth/user-not-found is expected if they don't exist
            if (authError.code !== 'auth/user-not-found') {
                throw authError;
            }
        }

        // 2. Create the Auth user
        const userRecord = await adminAuth.createUser({
            email,
            password: password || 'Password123!',
            displayName: name,
        });

        // 3. Set Custom Claims for RBAC
        await adminAuth.setCustomUserClaims(userRecord.uid, { role });

        // 4. Create the User document in Firestore
        const now = new Date().toISOString();
        const userData = {
            id: userRecord.uid,
            email,
            name,
            role,
            title: title || null,
            created_at: now,
            updated_at: now,
        };

        await adminDb.collection('users').doc(userRecord.uid).set(userData);

        return NextResponse.json({ message: 'User created successfully', userId: userRecord.uid }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { userId, email, password, name, title } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (name) updateData.displayName = name;

        if (Object.keys(updateData).length > 0) {
            await adminAuth.updateUser(userId, updateData);
        }

        // Update Firestore user document
        const firestoreUpdate: any = { updated_at: new Date().toISOString() };
        if (email) firestoreUpdate.email = email;
        if (name) firestoreUpdate.name = name;
        if (title !== undefined) firestoreUpdate.title = title;

        await adminDb.collection('users').doc(userId).update(firestoreUpdate);

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // 1. Delete from Firebase Authentication
        try {
            await adminAuth.deleteUser(userId);
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // 2. Delete from Firestore 'users' collection
        await adminDb.collection('users').doc(userId).delete();

        return NextResponse.json({ message: 'User deleted from Auth and Users collection' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
