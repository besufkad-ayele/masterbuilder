import { StorageService } from './storageService';

export class DataInitializationService {
  static initializeAllData(): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    this.initializeUsers();
  }

  static initializeUsers(): void {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) {
      // Development-only demo session when no user is logged in.
      StorageService.setCurrentUser({
        id: 'user-fellow-1',
        email: 'fellow@example.com',
        name: 'Marcus Thorne',
        role: 'FELLOW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  static resetAllData(): void {
    // No-op
  }
}
