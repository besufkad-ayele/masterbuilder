import { db, auth } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    setDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import {
    Company,
    User,
    FellowProfile,
    FacilitatorProfile,
    AdminProfile,
    CoachProfile,
    PeerCircle,
    Cohort,
    Wave,
    Competency,
    BehavioralIndicator,
    Phase,
    PhaseProgress,
    Portfolio,
    WaveResult,
    WaveCompetency,
    AdminDashboardState,
    FellowDashboardState,
    BehavioralIndicator as DBBehavioralIndicator,
    Phase as DBPhase,
    CompetencyDictionary,
    ContentItem,
    GroundingModule,
    PhaseType,
    PortfolioStatus,
    LDPNotification
} from '@/types';

import { groundingService } from './groundingService';
import { competencyService } from './competencyService';
import { FellowProgressService } from './FellowProgressService';
import { ExamService } from './ExamService';

export const firebaseService = {
    // --- Shared Getters ---
    async getUser(id: string): Promise<User | null> {
        const d = await getDoc(doc(db, 'users', id));
        return d.exists() ? { id: d.id, ...d.data() } as User : null;
    },

    async getAdminProfile(userId: string): Promise<AdminProfile | null> {
        const q = query(collection(db, 'admin_profiles'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() } as AdminProfile;
    },

    async getFacilitatorProfile(userId: string): Promise<FacilitatorProfile | null> {
        const q = query(collection(db, 'facilitator_profiles'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() } as FacilitatorProfile;
    },

    async getCompany(id: string): Promise<Company | null> {
        const d = await getDoc(doc(db, 'companies', id));
        return d.exists() ? { id: d.id, ...d.data() } as Company : null;
    },

    async getCohort(id: string): Promise<Cohort | null> {
        const d = await getDoc(doc(db, 'cohorts', id));
        return d.exists() ? { id: d.id, ...d.data() } as Cohort : null;
    },

    async getGroundingModule(id: string): Promise<GroundingModule | null> {
        const d = await getDoc(doc(db, 'grounding_modules', id));
        return d.exists() ? { id: d.id, ...d.data() } as GroundingModule : null;
    },

    async getCompanyCohorts(companyId: string): Promise<Cohort[]> {
        const q = query(collection(db, 'cohorts'), where('company_id', '==', companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));
    },

    async getCoachProfile(userId: string): Promise<CoachProfile | null> {
        const q = query(collection(db, 'coach_profiles'), where('user_id', '==', userId));
        const s = await getDocs(q);
        return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() } as CoachProfile;
    },

    async getPeerCircle(id: string): Promise<PeerCircle | null> {
        const d = await getDoc(doc(db, 'peer_circles', id));
        return d.exists() ? { id: d.id, ...d.data() } as PeerCircle : null;
    },

    async getCoachPeerCircle(coachId: string): Promise<PeerCircle | null> {
        const q = query(collection(db, 'peer_circles'), where('coach_id', '==', coachId));
        const s = await getDocs(q);
        return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() } as PeerCircle;
    },

    // --- Admin Methods ---
    admin: {
        async getDashboardState(): Promise<AdminDashboardState> {
            const users = await firebaseService.admin.getUsers();
            const companies = await firebaseService.admin.getCompanies();
            const cohorts = await firebaseService.admin.getCohorts();
            const fellows = await firebaseService.admin.getFellowProfiles();
            const evaluators = await firebaseService.admin.getFacilitatorProfiles();
            const coaches = await firebaseService.admin.getCoachProfiles();
            const peerCircles = await firebaseService.admin.getPeerCircles();
            const competencies = await firebaseService.admin.getCompetencies();
            const results = await firebaseService.admin.getWaveResults();
            const evaluations = await firebaseService.admin.getPortfolios();

            return {
                users,
                companies,
                cohorts,
                fellows,
                facilitators: evaluators,
                coaches,
                peerCircles,
                competencies,
                results,
                evaluations,
                groundingModules: await groundingService.getModules(),
                notifications: await firebaseService.notifications.getNotifications('admins')
            };
        },

        async getUsers(): Promise<User[]> {
            const snapshot = await getDocs(collection(db, 'users'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        },

        async getCompanies(): Promise<Company[]> {
            const snapshot = await getDocs(collection(db, 'companies'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
        },

        async getCohorts(): Promise<Cohort[]> {
            const snapshot = await getDocs(collection(db, 'cohorts'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));
        },

        async getFellowProfiles(): Promise<FellowProfile[]> {
            const snapshot = await getDocs(collection(db, 'fellow_profiles'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FellowProfile));
        },

        async getFacilitatorProfiles(): Promise<FacilitatorProfile[]> {
            const snapshot = await getDocs(collection(db, 'facilitator_profiles'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacilitatorProfile));
        },

        async getCoachProfiles(): Promise<CoachProfile[]> {
            const snapshot = await getDocs(collection(db, 'coach_profiles'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachProfile));
        },

        async getPeerCircles(): Promise<PeerCircle[]> {
            const snapshot = await getDocs(collection(db, 'peer_circles'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerCircle));
        },

        async createPeerCircle(data: PeerCircle): Promise<void> {
            await setDoc(doc(db, 'peer_circles', data.id), data);
        },

        async updatePeerCircle(id: string, updates: Partial<PeerCircle>): Promise<void> {
            await updateDoc(doc(db, 'peer_circles', id), updates);
        },

        async createCoachProfile(data: CoachProfile): Promise<void> {
            await setDoc(doc(db, 'coach_profiles', data.id), data);
        },

        async getCompetencies(): Promise<Competency[]> {
            const snapshot = await getDocs(collection(db, 'competencies'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competency));
        },

        async getWaveResults(): Promise<WaveResult[]> {
            const snapshot = await getDocs(collection(db, 'wave_results'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaveResult));
        },

        async getPortfolios(): Promise<Portfolio[]> {
            const snapshot = await getDocs(collection(db, 'portfolios'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Portfolio));
        },

        async getGroundingModules(): Promise<GroundingModule[]> {
            return groundingService.getModules();
        },

        async createCompany(companyData: Company): Promise<void> {
            await setDoc(doc(db, 'companies', companyData.id), companyData);
        },

        async createGroundingModule(item: GroundingModule): Promise<void> {
            await groundingService.createModule(item);
        },

        async deleteGroundingItem(id: string): Promise<void> {
            await groundingService.deleteModule(id);
        },
        async getCompany(id: string): Promise<Company | null> {
            return firebaseService.getCompany(id);
        },
        async getCohort(id: string): Promise<Cohort | null> {
            return firebaseService.getCohort(id);
        },
        async getGroundingLibraries(): Promise<GroundingModule[]> {
            return this.getGroundingModules();
        }
    },

    // --- Fellow Methods & Precise Scoring ---
    fellow: {
        async getDashboardState(userId: string): Promise<FellowDashboardState | null> {
            const user = await firebaseService.getUser(userId);
            if (!user) return null;

            const profile = await firebaseService.fellow.getFellowProfile(userId);
            if (!profile || !profile.is_active) return null;

            const company = await firebaseService.getCompany(profile.company_id);
            const cohort = profile.cohort_id ? await firebaseService.getCohort(profile.cohort_id) : null;

            if (!company || !cohort) return null;

            const waves = await firebaseService.fellow.getCohortWaves(cohort.id);
            const currentWave = profile.current_wave_id ? waves.find(w => w.id === profile.current_wave_id) : waves[0];

            // In a relational model, we filter competencies assigned to this wave/cohort
            const allCompetencies = await firebaseService.fellow.getCompetencies();
            const waveCompetenceIds = await firebaseService.fellow.getWaveCompetenceIds(currentWave?.id);
            const activeCompetencies = allCompetencies.filter(c => waveCompetenceIds.includes(c.id));

            const progress = await this.getFellowProgress(userId);
            const portfolios = await this.getFellowPortfolios(userId);
            const waveCompetencies = await this.getAllWaveCompetencies();
            const groundingResults = await this.getGroundingResults(userId);
            const examAttempts = await ExamService.getAttemptsByUser(userId);
            const exams = await ExamService.getExamsByCohort(cohort.id);
            const behavioralIndicators = await FellowProgressService.getAllBehavioralIndicators();
            const gmds = await groundingService.getModulesByCompany(company.id);
            const groundingModule = gmds[0] || null;
            const notifications = await firebaseService.notifications.getNotifications(cohort.id || 'fellows');

            return {
                user,
                profile,
                company,
                cohort,
                currentWave,
                waves,
                competencies: activeCompetencies,
                progress,
                portfolios,
                waveCompetencies,
                groundingModule,
                groundingResults,
                examAttempts,
                exams,
                behavioralIndicators,
                notifications
            };
        },

        async getWaveCompetenceIds(waveId?: string): Promise<string[]> {
            if (!waveId) return [];
            const q = query(collection(db, 'wave_competencies'), where('wave_id', '==', waveId));
            const s = await getDocs(q);
            return s.docs.map(doc => doc.data().competency_id);
        },

        async calculateCompetencyResult(userId: string, competencyId: string): Promise<number> {
            const biQuery = query(collection(db, 'behavioral_indicators'), where('competency_id', '==', competencyId));
            const biSnap = await getDocs(biQuery);
            const biIds = biSnap.docs.map(d => d.id);

            if (biIds.length === 0) return 0;

            // Fetch all required data for calculation
            const [progress, portfolios, groundingResults, profile] = await Promise.all([
                this.getFellowProgress(userId),
                this.getFellowPortfolios(userId),
                this.getGroundingResults(userId),
                this.getFellowProfile(userId)
            ]);

            // Get the Grounding score (normalized to 100)
            const groundingScore = groundingResults[0]?.score || 0;

            // Get the Competency Exam score (normalized to 100)
            // We need the cohort ID from the profile
            let examScore = 0;
            if (profile?.cohort_id) {
                const exams = await ExamService.getExamsByCohortAndCompetency(profile.cohort_id, competencyId);
                if (exams.length > 0) {
                    const attempts = await ExamService.getAttemptsByUser(userId);
                    const compExamAttempt = attempts.find(a => a.exam_id === exams[0].id);
                    examScore = compExamAttempt?.score || 0;
                }
            }

            return FellowProgressService.calculateCompetencyTotalScore(
                biIds,
                progress,
                portfolios,
                groundingScore,
                examScore
            );
        },

        async calculateBIScore(userId: string, biId: string): Promise<number> {
            const progress = await this.getFellowProgress(userId);
            const portfolios = await this.getFellowPortfolios(userId);

            const biProgress = progress.filter(p => p.behavioral_indicator_id === biId);
            const biPortfolios = portfolios.filter(p => p.behavioral_indicator_id === biId);

            return FellowProgressService.calculateBIScore(biProgress, biPortfolios);
        },

        async getGroundingResults(userId: string): Promise<any[]> {
            const q = query(collection(db, 'grounding_results'), where('fellow_id', '==', userId));
            const s = await getDocs(q);
            return s.docs.map(d => ({ id: d.id, ...d.data() }));
        },

        async getFellowProfile(userId: string): Promise<FellowProfile | null> {
            const q = query(collection(db, 'fellow_profiles'), where('user_id', '==', userId));
            const s = await getDocs(q);
            return s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() } as FellowProfile;
        },

        async getCohortWaves(cohortId: string): Promise<Wave[]> {
            const q = query(collection(db, 'waves'), where('cohort_id', '==', cohortId), orderBy('number'));
            const s = await getDocs(q);
            return s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wave));
        },

        async getCompetencies(): Promise<Competency[]> {
            const snapshot = await getDocs(collection(db, 'competencies'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competency));
        },

        async getFellowProgress(userId: string): Promise<PhaseProgress[]> {
            const q = query(collection(db, 'phase_progress'), where('user_id', '==', userId));
            const s = await getDocs(q);
            return s.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhaseProgress));
        },

        async getFellowPortfolios(userId: string): Promise<Portfolio[]> {
            const q = query(collection(db, 'portfolios'), where('user_id', '==', userId));
            const s = await getDocs(q);
            return s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Portfolio));
        },

        async getAllWaveCompetencies(): Promise<WaveCompetency[]> {
            const s = await getDocs(collection(db, 'wave_competencies'));
            return s.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaveCompetency));
        },

        async getCompetencyDetails(id: string): Promise<CompetencyDictionary | null> {
            const docRef = doc(db, 'competency_dictionary', id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as CompetencyDictionary : null;
        },

        async initializeProgress(userId: string, type: 'grounding' | 'competency', targetId: string) {
            const now = new Date().toISOString();
            if (type === 'grounding') {
                const q = query(collection(db, 'grounding_results'), where('fellow_id', '==', userId), where('grounding_id', '==', targetId));
                const s = await getDocs(q);
                if (s.empty) {
                    const docRef = doc(collection(db, 'grounding_results'));
                    await setDoc(docRef, {
                        id: docRef.id,
                        fellow_id: userId,
                        grounding_id: targetId,
                        status: 'in_progress',
                        started_at: now,
                        created_at: now,
                        updated_at: now,
                        score: 0,
                        is_passed: false
                    });
                }
            } else {
                // Initialize behavioral indicators for a competency
                const biQuery = query(collection(db, 'behavioral_indicators'), where('competency_id', '==', targetId));
                const biSnap = await getDocs(biQuery);
                const batch = writeBatch(db);

                for (const biDoc of biSnap.docs) {
                    const biId = biDoc.id;
                    const phases: PhaseType[] = ['believe', 'know', 'do'];

                    for (const phase of phases) {
                        const progQuery = query(
                            collection(db, 'phase_progress'),
                            where('user_id', '==', userId),
                            where('behavioral_indicator_id', '==', biId),
                            where('phase_type', '==', phase)
                        );
                        const progSnap = await getDocs(progQuery);

                        if (progSnap.empty) {
                            const progRef = doc(collection(db, 'phase_progress'));
                            batch.set(progRef, {
                                id: progRef.id,
                                user_id: userId,
                                behavioral_indicator_id: biId,
                                phase_type: phase,
                                status: phase === 'believe' ? 'active' : 'locked',
                                created_at: now,
                                updated_at: now
                            });
                        }
                    }
                }
                await batch.commit();
            }
        },

        async submitPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
            const portfoliosRef = collection(db, 'portfolios');
            const docRef = doc(portfoliosRef);
            const now = new Date().toISOString();
            await setDoc(docRef, {
                ...portfolio,
                id: docRef.id,
                created_at: now,
                updated_at: now,
                submitted_at: now
            });
            return docRef.id;
        },

        async updatePortfolioStatus(id: string, status: PortfolioStatus): Promise<void> {
            const ref = doc(db, 'portfolios', id);
            await updateDoc(ref, {
                status,
                updated_at: new Date().toISOString(),
                ...(status === 'submitted' ? { submitted_at: new Date().toISOString() } : {})
            });
        },

        async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<void> {
            const ref = doc(db, 'portfolios', id);
            await updateDoc(ref, {
                ...updates,
                updated_at: new Date().toISOString()
            });
        },

        async updatePhaseProgress(userId: string, biId: string, phaseType: PhaseType, updates: Partial<PhaseProgress>): Promise<void> {
            const q = query(
                collection(db, 'phase_progress'),
                where('user_id', '==', userId),
                where('behavioral_indicator_id', '==', biId),
                where('phase_type', '==', phaseType)
            );
            const s = await getDocs(q);
            const now = new Date().toISOString();

            if (s.empty) {
                const docRef = doc(collection(db, 'phase_progress'));
                await setDoc(docRef, {
                    id: docRef.id,
                    user_id: userId,
                    behavioral_indicator_id: biId,
                    phase_type: phaseType,
                    ...updates,
                    created_at: now,
                    updated_at: now
                });
            } else {
                const docRef = doc(db, 'phase_progress', s.docs[0].id);
                await updateDoc(docRef, {
                    ...updates,
                    updated_at: now
                });
            }
        },

        async trackGroundingContent(userId: string, targetId: string, contentId: string) {
            const q = query(collection(db, 'grounding_results'), where('fellow_id', '==', userId), where('grounding_id', '==', targetId));
            const s = await getDocs(q);
            const now = new Date().toISOString();

            if (s.empty) {
                const docRef = doc(collection(db, 'grounding_results'));
                await setDoc(docRef, {
                    id: docRef.id,
                    fellow_id: userId,
                    grounding_id: targetId,
                    status: 'in_progress',
                    completed_content: [contentId],
                    started_at: now,
                    created_at: now,
                    updated_at: now
                });
            } else {
                const docRef = doc(db, 'grounding_results', s.docs[0].id);
                const data = s.docs[0].data();
                const completedContent = data.completed_content || [];

                if (!completedContent.includes(contentId)) {
                    await updateDoc(docRef, {
                        completed_content: [...completedContent, contentId],
                        updated_at: now
                    });
                }
            }
        },

        async updateGroundingPerformance(userId: string, targetId: string, score: number, status: 'in_progress' | 'completed' = 'completed') {
            const q = query(collection(db, 'grounding_results'), where('fellow_id', '==', userId), where('grounding_id', '==', targetId));
            const s = await getDocs(q);
            const now = new Date().toISOString();

            if (s.empty) {
                const docRef = doc(collection(db, 'grounding_results'));
                await setDoc(docRef, {
                    id: docRef.id,
                    fellow_id: userId,
                    grounding_id: targetId,
                    status,
                    score,
                    is_passed: score >= 5,
                    started_at: now,
                    created_at: now,
                    updated_at: now
                });
            } else {
                const docRef = doc(db, 'grounding_results', s.docs[0].id);
                await updateDoc(docRef, {
                    score,
                    status,
                    is_passed: score >= 5,
                    updated_at: now
                });
            }
        }
    },

    coach: {
        async getDashboardState(userId: string): Promise<CoachDashboardState | null> {
            const user = await firebaseService.getUser(userId);
            if (!user) return null;

            const profile = await firebaseService.getCoachProfile(userId);
            if (!profile || !profile.is_active) return null;

            const peerCircle = await firebaseService.getCoachPeerCircle(profile.id);
            
            const notifications = await firebaseService.notifications.getNotifications(peerCircle?.cohort_id || 'coaches');

            if (!peerCircle) return {
                user,
                profile,
                peerCircle: null,
                fellows: [],
                portfolios: [],
                progress: [],
                notifications
            };

            // Fetch fellows in the peer circle
            const fellowProfiles = await firebaseService.admin.getFellowProfiles();
            const circleFellows = fellowProfiles.filter(f => peerCircle.fellow_ids.includes(f.user_id));

            // Fetch portfolios and progress for these fellows
            const portfolios: Portfolio[] = [];
            const progress: PhaseProgress[] = [];

            for (const fellow of circleFellows) {
                const fPortfolios = await firebaseService.fellow.getFellowPortfolios(fellow.user_id);
                const fProgress = await firebaseService.fellow.getFellowProgress(fellow.user_id);
                portfolios.push(...fPortfolios);
                progress.push(...fProgress);
            }

            return {
                user,
                profile,
                peerCircle,
                fellows: circleFellows,
                portfolios,
                progress,
                notifications
            };
        }
    },

    notifications: {
        async getNotifications(audience?: string, onlyActive: boolean = true): Promise<LDPNotification[]> {
            let q;
            if (onlyActive) {
                q = query(collection(db, 'notifications'), where('is_active', '==', true), orderBy('created_at', 'desc'));
            } else {
                q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'));
            }
            const snapshot = await getDocs(q);
            let all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LDPNotification));

            // Client-side safety filter for is_active
            if (onlyActive) {
                all = all.filter(n => n.is_active === true);
            }

            if (!audience || audience === 'all') return all;

            return all.filter(n =>
                n.target_audience === 'all' ||
                n.target_audience === audience ||
                (audience === 'fellows' && n.target_audience === 'fellows') ||
                (audience === 'admins' && (n.target_audience === 'admins' || n.target_audience === 'all'))
            );
        },
        async createNotification(notification: Omit<LDPNotification, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
            const docRef = doc(collection(db, 'notifications'));
            const now = new Date().toISOString();
            await setDoc(docRef, {
                ...notification,
                id: docRef.id,
                created_at: now,
                updated_at: now
            });
            return docRef.id;
        },
        async updateNotification(id: string, updates: Partial<LDPNotification>): Promise<void> {
            const ref = doc(db, 'notifications', id);
            await updateDoc(ref, {
                ...updates,
                updated_at: new Date().toISOString()
            });
        },
        async deleteNotification(id: string): Promise<void> {
            await deleteDoc(doc(db, 'notifications', id));
        }
    },
    auth: {
        async changePassword(newPassword: string): Promise<void> {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
            } else {
                throw new Error("No user is currently signed in.");
            }
        }
    }
};
