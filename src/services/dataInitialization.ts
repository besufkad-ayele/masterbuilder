import { StorageService } from './storageService';
import { User } from '@/types';

export class DataInitializationService {
  static initializeAllData(): void {
    // No-op or minimal initialization for local storage sessions
    this.initializeUsers();
  }

  static initializeUsers(): void {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) {
      // Create a default session user for demo purposes if none exists
      const demoUser: User = {
        id: 'user-fellow-1',
        email: 'fellow@example.com',
        name: 'Marcus Thorne',
        role: 'FELLOW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      StorageService.setCurrentUser(demoUser);
    }
  }

  static resetAllData(): void {
    // No-op
  }
}
