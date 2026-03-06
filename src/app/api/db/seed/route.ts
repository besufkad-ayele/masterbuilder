import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = "force-dynamic";
import {
    Company,
    User,
    FellowProfile,
    FacilitatorProfile,
    AdminProfile,
    Cohort,
    Wave,
    Competency,
    BehavioralIndicator,
    Phase,
    PhaseProgress,
    Portfolio,
    WaveResult,
    GroundingSubmission
} from '@/types';

/**
 * SEEDING SCRIPT - LDP RELATIONAL ARCHITECTURE (16 CORE COLLECTIONS)
 * This script initializes the database with a clean structure or sample data.
 */
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'sample'; // 'minimal' or 'sample'

    const results: any = {
        collections: [
            'users', 'admin_profiles', 'facilitator_profiles', 'fellow_profiles',
            'companies', 'cohorts', 'waves', 'wave_competencies',
            'competencies', 'behavioral_indicators', 'phases', 'grounding_modules',
            'phase_progress', 'portfolios', 'wave_results', 'grounding_submissions'
        ],
        counts: {},
        errors: [],
        logs: []
    };

    const log = (msg: string) => {
        console.log(msg);
        results.logs.push(msg);
    };

    try {
        log(`Starting seeding in ${mode} mode...`);
        const now = new Date().toISOString();

        if (mode === 'minimal') {
            log('Minimal mode selected. Ensure you have run the CLI reset-db script for Auth clearing.');
            return NextResponse.json({ success: true, message: 'Minimal state achieved via CLI script.', results });
        }

        // --- SAMPLE DATA SECTION (MEDROC FOCUS) ---

        // 1. Seed Companies
        const medroc: Company = {
            id: 'medroc-1',
            name: 'MEDROC Investment Group',
            industry: 'Multi-sectoral (Mining & Energy)',
            size_range: '5000+',
            contact_email: 'info@medroc-investment.com',
            phone: '+251 11 123 4567',
            location: 'Addis Ababa, Ethiopia',
            logoUrl: 'https://ui-avatars.com/api/?name=MEDROC+Investment&background=b91c1c&color=fff',
            created_at: now,
            updated_at: now
        };
        await adminDb.collection('companies').doc(medroc.id).set(medroc);
        results.counts.companies = 1;

        // 2. Seed Cohorts & Waves
        const medrocCohort: Cohort = {
            id: 'cohort-medroc-1',
            company_id: medroc.id,
            name: 'MEDROC Mining Cluster Wave 1',
            description: 'Leadership development for project managers.',
            wave_level: 'Basic',
            enrollment_mode: 'invite_only',
            status: 'active',
            is_grounding_active: true,
            start_date: '2026-03-15T00:00:00Z',
            end_date: '2026-09-15T00:00:00Z',
            created_at: now,
            updated_at: now
        };
        await adminDb.collection('cohorts').doc(medrocCohort.id).set(medrocCohort);
        results.counts.cohorts = 1;

        const wave1: Wave = {
            id: 'wave-medroc-1',
            cohort_id: medrocCohort.id,
            number: 1,
            name: 'Wave 1: Leading Yourself',
            status: 'active',
            created_at: now,
            updated_at: now
        };
        await adminDb.collection('waves').doc(wave1.id).set(wave1);
        results.counts.waves = 1;

        // 3. Seed Users & Profiles
        const sampleFellow = { id: 'sample-fellow-1', email: 'fellow@leadlife.com', name: 'Sample Fellow', role: 'FELLOW' };

        await adminDb.collection('users').doc(sampleFellow.id).set({
            ...sampleFellow,
            created_at: now,
            updated_at: now
        });

        await adminDb.collection('fellow_profiles').doc(`profile-${sampleFellow.id}`).set({
            id: `profile-${sampleFellow.id}`,
            user_id: sampleFellow.id,
            company_id: medroc.id,
            cohort_id: medrocCohort.id,
            current_wave_id: wave1.id,
            is_active: true,
            created_at: now,
            updated_at: now
        });
        results.counts.users = 1;
        results.counts.profiles = 1;

        // 4. Competency Framework
        const comp1: Competency = {
            id: 'comp-resilience',
            code: 'LY-1',
            title: 'Resilience',
            description: 'Bouncing back from setbacks.',
            category: 'ly',
            level: 'Basic',
            created_at: now,
            updated_at: now
        };
        await adminDb.collection('competencies').doc(comp1.id).set(comp1);
        results.counts.competencies = 1;

        await adminDb.collection('wave_competencies').doc(`wc-${wave1.id}-${comp1.id}`).set({
            id: `wc-${wave1.id}-${comp1.id}`,
            wave_id: wave1.id,
            competency_id: comp1.id,
            display_order: 1,
            created_at: now
        });

        // 5. Progress Collections (Initialize with examples)
        const progress: PhaseProgress = {
            id: `progress-${sampleFellow.id}-res-believe`,
            user_id: sampleFellow.id,
            behavioral_indicator_id: 'bi-res-1',
            phase_type: 'believe',
            believe_passed: true,
            created_at: now,
            updated_at: now
        };
        await adminDb.collection('phase_progress').doc(progress.id).set(progress);
        results.counts.phase_progress = 1;

        log('Seeding completed successfully.');
        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        log(`FATAL: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}