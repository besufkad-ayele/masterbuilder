import {
  User,
  STORAGE_KEYS,
} from '@/types';

/**
 * StorageService handles client-side session persistence.
 * All domain data (Companies, Cohorts, etc.) should be fetched via firebaseService.
 */
export class StorageService {
  private static isBrowser = typeof window !== 'undefined';

  private static getItem<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  private static setItem<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Session Management ---
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('ldp_current_user_id', user.id);
    } else {
      localStorage.removeItem('ldp_current_user_id');
    }
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static getCurrentUser(): User | null {
    return this.getItem<User>(STORAGE_KEYS.CURRENT_USER);
  }

  static setAuthToken(token: string | null): void {
    if (!this.isBrowser) return;
    if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static getAuthToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static clearSession(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem('ldp_current_user_id');
  }
}
