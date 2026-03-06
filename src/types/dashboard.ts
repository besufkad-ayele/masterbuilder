import { Competency, BehavioralIndicator } from "./index";

export interface Wave {
    id: string;
    name: string;
    competencyIds: string[];
    description: string;
}

export interface PerformanceMetric {
    behavioralIndicatorId: string;
    believePassed: boolean;
    knowScore: number; // out of 20
    doPortfolioScore: number; // out of 100 or rating
    average: number;
}

export interface PortfolioItem {
    id: string;
    competencyId: string;
    behavioralIndicatorId: string;
    title: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
}

export interface FellowDashboardData {
    fellowId: string;
    currentWaveId: string;
    waves: Wave[];
    performance: PerformanceMetric[];
    portfolio: PortfolioItem[];
    competencyExams: {
        competencyId: string;
        score: number; // out of 20
    }[];
}
