import { adminAuth, adminDb } from '../firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function clearAuth() {
    console.log('--- Clearing Authentication ---');
    let totalDeleted = 0;

    // Recursive function to clear all users
    const listAndDeleteUsers = async (nextPageToken?: string) => {
        const result = await adminAuth.listUsers(1000, nextPageToken);
        const uids = result.users.map(u => u.uid);

        if (uids.length > 0) {
            await adminAuth.deleteUsers(uids);
            totalDeleted += uids.length;
            console.log(`Deleted ${uids.length} users...`);
        }

        if (result.pageToken) {
            await listAndDeleteUsers(result.pageToken);
        }
    };

    await listAndDeleteUsers();
    console.log(`Total Auth users deleted: ${totalDeleted}`);
}

async function clearFirestore() {
    console.log('--- Clearing Firestore ---');
    const collections = await adminDb.listCollections();

    for (const collection of collections) {
        console.log(`Clearing collection: ${collection.id}`);
        const snapshot = await collection.get();
        if (snapshot.empty) continue;

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Deleted ${snapshot.size} documents from ${collection.id}`);
    }
}

async function createAdmins() {
    console.log('--- Creating Fresh Admin Users ---');
    const adminTypes = [
        { email: 'super@leadlife.com', password: 'Password123!', name: 'Lead Life Super Admin', title: 'Super Admin' },
        { email: 'profile@leadlife.com', password: 'Password123!', name: 'Lead Life Profile Admin', title: 'Profile Admin' },
        { email: 'content@leadlife.com', password: 'Password123!', name: 'Lead Life Content Admin', title: 'Content Admin' }
    ];

    for (const admin of adminTypes) {
        try {
            // Create Auth User
            const userRecord = await adminAuth.createUser({
                email: admin.email,
                password: admin.password,
                displayName: admin.name,
            });

            const now = new Date().toISOString();

            // Create User Document in 'users' collection
            await adminDb.collection('users').doc(userRecord.uid).set({
                id: userRecord.uid,
                email: admin.email,
                name: admin.name,
                role: 'ADMIN',
                title: admin.title,
                created_at: now,
                updated_at: now
            });

            // Create Admin Profile in 'admin_profiles' collection
            await adminDb.collection('admin_profiles').doc(`profile-${userRecord.uid}`).set({
                id: `profile-${userRecord.uid}`,
                user_id: userRecord.uid,
                title: admin.title,
                is_active: true,
                created_at: now,
                updated_at: now
            });

            console.log(`- ${admin.title} Created: ${admin.email}`);
        } catch (error: any) {
            console.error(`Error creating ${admin.title}:`, error.message);
        }
    }
}

async function initializeEmptyCollections() {
    console.log('--- Preparing Architecture (16 Collections) ---');
    const collections = [
        'users', 'admin_profiles', 'facilitator_profiles', 'fellow_profiles',
        'companies', 'cohorts', 'waves', 'wave_competencies',
        'competencies', 'behavioral_indicators', 'phases', 'grounding_modules',
        'phase_progress', 'portfolios', 'wave_results', 'grounding_submissions'
    ];

    console.log('The following collections are recognized in the architecture:');
    collections.forEach(c => console.log(` - ${c}`));
    console.log('(Note: Firestore collections are only visible in console when they contain at least one document.)');
}

async function seedInitialData() {
    console.log('--- Seeding Initial Test Data ---');
    const now = new Date().toISOString();

    // 1. Seed Companies
    const companies = [
        { id: 'comp-nexora', name: 'Nexora Solutions Ltd.', industry: 'Technology', status: 'Active' },
        { id: 'comp-zenith', name: 'Zenith Global Group', industry: 'Finance', status: 'Active' }
    ];

    for (const comp of companies) {
        await adminDb.collection('companies').doc(comp.id).set({
            ...comp,
            created_at: now,
            updated_at: now
        });
        console.log(`- Seeded Company: ${comp.name}`);
    }

    // 2. Seed Master Competencies
    const competencies = [
        { id: 'comp-strat', title: 'Strategic Thinking', category: 'Leadership', level: 'Basic', description: 'Thinking beyond the immediate.' },
        { id: 'comp-comm', title: 'Influential Communication', category: 'Soft Skills', level: 'Basic', description: 'Communicating with impact.' },
        { id: 'comp-decis', title: 'Data-Driven Decision Making', category: 'Operational', level: 'Intermediate', description: 'Using analytics to decide.' }
    ];

    for (const comp of competencies) {
        await adminDb.collection('competencies').doc(comp.id).set({
            ...comp,
            created_at: now,
            updated_at: now
        });
        console.log(`- Seeded Competency: ${comp.title}`);
    }

    // 3. Seed Fellows
    const fellows = [
        { email: 'f.biruk@nexora.com', name: 'Biruk Tadesse', companyId: 'comp-nexora' },
        { email: 's.mulugeta@nexora.com', name: 'Selam Mulugeta', companyId: 'comp-nexora' },
        { email: 'a.kebede@zenith.com', name: 'Abebe Kebede', companyId: 'comp-zenith' }
    ];

    for (const fellow of fellows) {
        try {
            const userRecord = await adminAuth.createUser({
                email: fellow.email,
                password: 'Password123!',
                displayName: fellow.name,
            });

            await adminDb.collection('users').doc(userRecord.uid).set({
                id: userRecord.uid,
                email: fellow.email,
                name: fellow.name,
                role: 'FELLOW',
                created_at: now,
                updated_at: now
            });

            await adminDb.collection('fellow_profiles').doc(`prof-${userRecord.uid}`).set({
                id: `prof-${userRecord.uid}`,
                user_id: userRecord.uid,
                company_id: fellow.companyId,
                full_name: fellow.name,
                email: fellow.email,
                status: 'Active',
                created_at: now,
                updated_at: now
            });
            console.log(`- Seeded Fellow: ${fellow.name} (${fellow.email})`);
        } catch (error: any) {
            console.error(`Error seeding fellow ${fellow.name}:`, error.message);
        }
    }
}

async function main() {
    console.log('===================================');
    console.log('DATABASE RESET & INITIALIZATION');
    console.log('===================================');

    try {
        await clearAuth();
        await clearFirestore();
        await initializeEmptyCollections();
        await createAdmins();
        await seedInitialData();

        console.log('===================================');
        console.log('System is now FRESH and READY.');
        console.log('===================================');
    } catch (error) {
        console.error('FATAL ERROR during reset:', error);
        process.exit(1);
    }
}

main();
