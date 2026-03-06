import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = "force-dynamic";

export async function POST() {
    return NextResponse.json({
        message: 'Advanced seeding is currently disabled while restructuring data layers. Use /api/db/seed for the new MEDROC-centric structure.',
        status: 'obsolete'
    });
}
