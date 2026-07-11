import { StorageService } from '@/services/storageService';
import type { AdminDashboardState } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function redirectToHomeIfUnauthorized() {
  if (typeof window === 'undefined') return;

  StorageService.clearSession();
  try {
    sessionStorage.removeItem('admin_dashboard_cache');
  } catch {
    /* ignore */
  }

  const path = window.location.pathname;
  if (path === '/' || path.startsWith('/login') || path.startsWith('/admin-login')) {
    return;
  }

  window.location.replace('/');
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = StorageService.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const msg =
        (error as { message?: string | string[] }).message ||
        `API Error: ${response.status} ${response.statusText}`;
      const message = Array.isArray(msg) ? msg.join(', ') : String(msg);

      if (
        response.status === 401 ||
        /unauthorized/i.test(message)
      ) {
        redirectToHomeIfUnauthorized();
        throw new Error('Unauthorized');
      }

      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (!text) return undefined as T;

    if (contentType.includes('application/json')) {
      return JSON.parse(text) as T;
    }

    // Nest may return bare strings (e.g. generated IDs) as text/plain
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile(file: Blob | File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${this.baseURL}/files/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Upload failed';
      if (response.status === 401 || /unauthorized/i.test(message)) {
        redirectToHomeIfUnauthorized();
      }
      throw new Error(message);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();

export interface LoginResponse {
  accessToken: string;
  user: Record<string, unknown>;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),
  me: () => apiClient.get<Record<string, unknown>>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};

export const adminApi = {
  getDashboard: () => apiClient.get<AdminDashboardState>('/admin/dashboard'),
};

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: unknown) => apiClient.post('/users', data),
  update: (id: string, data: unknown) => apiClient.patch(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export const companiesApi = {
  getAll: () => apiClient.get('/companies'),
  getById: (id: string) => apiClient.get(`/companies/${id}`),
  create: (data: unknown) => apiClient.post('/companies', data),
  update: (id: string, data: unknown) => apiClient.patch(`/companies/${id}`, data),
  delete: (id: string) => apiClient.delete(`/companies/${id}`),
};

export const cohortsApi = {
  getAll: (companyId?: string) =>
    apiClient.get(`/cohorts${companyId ? `?companyId=${companyId}` : ''}`),
  getById: (id: string) => apiClient.get(`/cohorts/${id}`),
  create: (data: unknown) => apiClient.post('/cohorts', data),
  createWithWaves: (data: unknown) => apiClient.post('/cohorts/with-waves', data),
  update: (id: string, data: unknown) => apiClient.patch(`/cohorts/${id}`, data),
  updateWithWaves: (id: string, data: unknown) => apiClient.patch(`/cohorts/${id}/with-waves`, data),
  delete: (id: string) => apiClient.delete(`/cohorts/${id}`),
};

export const fellowsApi = {
  getAll: (companyId?: string, cohortId?: string) => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (cohortId) params.set('cohortId', cohortId);
    const q = params.toString();
    return apiClient.get(`/fellows${q ? `?${q}` : ''}`);
  },
  getDashboard: (userId: string) => apiClient.get(`/fellows/dashboard/${userId}`),
  getById: (id: string) => apiClient.get(`/fellows/${id}`),
  create: (data: unknown) => apiClient.post('/fellows', data),
  update: (id: string, data: unknown) => apiClient.patch(`/fellows/${id}`, data),
  delete: (id: string) => apiClient.delete(`/fellows/${id}`),
  generateId: async (companyId: string, prefix: string) => {
    const result = await apiClient.get<string | { fellowId?: string; id?: string }>(
      `/fellows/generate-id?companyId=${companyId}&prefix=${prefix}`,
    );
    if (typeof result === 'string') return result;
    return String(result.fellowId ?? result.id ?? '');
  },
};

export const facilitatorsApi = {
  getAll: () => apiClient.get('/facilitators'),
  getById: (id: string) => apiClient.get(`/facilitators/${id}`),
  create: (data: unknown) => apiClient.post('/facilitators', data),
  update: (id: string, data: unknown) => apiClient.patch(`/facilitators/${id}`, data),
  delete: (id: string) => apiClient.delete(`/facilitators/${id}`),
};

export const coachesApi = {
  getAll: () => apiClient.get('/coaches'),
  getDashboard: (userId: string) => apiClient.get(`/coaches/dashboard/${userId}`),
  getById: (id: string) => apiClient.get(`/coaches/${id}`),
  create: (data: unknown) => apiClient.post('/coaches', data),
  update: (id: string, data: unknown) => apiClient.patch(`/coaches/${id}`, data),
  delete: (id: string) => apiClient.delete(`/coaches/${id}`),
  getPeerCircles: () => apiClient.get('/coaches/peer-circles'),
  createPeerCircle: (data: unknown) => apiClient.post('/coaches/peer-circles', data),
  updatePeerCircle: (id: string, data: unknown) => apiClient.patch(`/coaches/peer-circles/${id}`, data),
  deletePeerCircle: (id: string) => apiClient.delete(`/coaches/peer-circles/${id}`),
};

export const adminsApi = {
  getAll: () => apiClient.get('/admins'),
  create: (data: unknown) => apiClient.post('/admins', data),
  update: (id: string, data: unknown) => apiClient.patch(`/admins/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admins/${id}`),
};

export const progressApi = {
  getPhaseProgress: (userId: string) => apiClient.get(`/progress/users/${userId}/phase-progress`),
  getPortfolios: (userId: string) => apiClient.get(`/progress/users/${userId}/portfolios`),
  getWaveResults: (userId: string) => apiClient.get(`/progress/users/${userId}/wave-results`),
  getGroundingResults: (userId: string) => apiClient.get(`/progress/users/${userId}/grounding-results`),
  getWaves: (cohortId?: string) => apiClient.get(`/progress/waves${cohortId ? `?cohortId=${cohortId}` : ''}`),
  getWaveCompetencies: (waveId?: string) =>
    apiClient.get(`/progress/wave-competencies${waveId ? `?waveId=${waveId}` : ''}`),
  getBehavioralIndicators: () => apiClient.get('/progress/behavioral-indicators'),
  getCompetencies: () => apiClient.get('/progress/competencies'),
  submitPortfolio: (data: unknown) => apiClient.post('/progress/portfolios', data),
  updatePortfolio: (id: string, data: unknown) => apiClient.patch(`/progress/portfolios/${id}`, data),
  reviewPortfolio: (id: string, data: unknown) => apiClient.patch(`/progress/portfolios/${id}/review`, data),
  upsertPhaseProgress: (data: unknown) => apiClient.post('/progress/phase-progress', data),
  upsertGroundingResult: (data: unknown) => apiClient.post('/progress/grounding-results', data),
  initialize: (data: unknown) => apiClient.post('/progress/initialize', data),
};

export const examsApi = {
  getAll: (cohortId?: string, competencyId?: string) => {
    const params = new URLSearchParams();
    if (cohortId) params.set('cohortId', cohortId);
    if (competencyId) params.set('competencyId', competencyId);
    const q = params.toString();
    return apiClient.get(`/exams${q ? `?${q}` : ''}`);
  },
  getById: (id: string) => apiClient.get(`/exams/${id}`),
  create: (data: unknown) => apiClient.post('/exams', data),
  update: (id: string, data: unknown) => apiClient.patch(`/exams/${id}`, data),
  delete: (id: string) => apiClient.delete(`/exams/${id}`),
  getAttempts: (userId?: string, examId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (examId) params.set('examId', examId);
    const q = params.toString();
    return apiClient.get(`/exams/attempts${q ? `?${q}` : ''}`);
  },
  createAttempt: (data: unknown) => apiClient.post('/exams/attempts', data),
  updateAttempt: (id: string, data: unknown) => apiClient.patch(`/exams/attempts/${id}`, data),
  getExaminations: (cohortId?: string, fellowId?: string) => {
    const params = new URLSearchParams();
    if (cohortId) params.set('cohortId', cohortId);
    if (fellowId) params.set('fellowId', fellowId);
    const q = params.toString();
    return apiClient.get(`/exams/examinations${q ? `?${q}` : ''}`);
  },
  getExamination: (id: string) => apiClient.get(`/exams/examinations/${id}`),
  createExamination: (data: unknown) => apiClient.post('/exams/examinations', data),
  updateExamination: (id: string, data: unknown) => apiClient.patch(`/exams/examinations/${id}`, data),
  deleteExamination: (id: string) => apiClient.delete(`/exams/examinations/${id}`),
  getQuestionBanks: (cohortId?: string) =>
    apiClient.get(`/exams/question-banks${cohortId ? `?cohortId=${cohortId}` : ''}`),
  saveQuestionBank: (data: unknown) => apiClient.post('/exams/question-banks', data),
  getExaminationAttempts: (userId?: string, examinationId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (examinationId) params.set('examinationId', examinationId);
    const q = params.toString();
    return apiClient.get(`/exams/examination-attempts${q ? `?${q}` : ''}`);
  },
  upsertExaminationAttempt: (data: unknown) => apiClient.post('/exams/examination-attempts', data),
};

export const filesApi = {
  upload: (file: Blob | File) => apiClient.uploadFile(file),
};

export const competenciesApi = {
  getAll: () => apiClient.get('/competencies'),
  getDictionary: () => apiClient.get('/competencies/dictionary'),
  getLibrary: (companyId?: string) =>
    apiClient.get(`/competencies/library${companyId ? `?companyId=${companyId}` : ''}`),
  create: (data: unknown) => apiClient.post('/competencies', data),
  delete: (id: string) => apiClient.delete(`/competencies/${id}`),
  createDictionary: (data: unknown) => apiClient.post('/competencies/dictionary', data),
  updateDictionary: (id: string, data: unknown) =>
    apiClient.patch(`/competencies/dictionary/${id}`, data),
  deleteDictionary: (id: string) => apiClient.delete(`/competencies/dictionary/${id}`),
  createLibrary: (data: unknown) => apiClient.post('/competencies/library', data),
  updateLibrary: (id: string, data: unknown) => apiClient.patch(`/competencies/library/${id}`, data),
  deleteLibrary: (id: string) => apiClient.delete(`/competencies/library/${id}`),
};

export const groundingApi = {
  getAll: (companyId?: string) =>
    apiClient.get(`/grounding-modules${companyId ? `?companyId=${companyId}` : ''}`),
  getById: (id: string) => apiClient.get(`/grounding-modules/${id}`),
  create: (data: unknown) => apiClient.post('/grounding-modules', data),
  update: (id: string, data: unknown) => apiClient.patch(`/grounding-modules/${id}`, data),
  delete: (id: string) => apiClient.delete(`/grounding-modules/${id}`),
};

export const notificationsApi = {
  getAll: (audience?: string) =>
    apiClient.get(`/notifications${audience ? `?audience=${audience}` : ''}`),
  create: (data: unknown) => apiClient.post('/notifications', data),
  update: (id: string, data: unknown) => apiClient.patch(`/notifications/${id}`, data),
  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
};
