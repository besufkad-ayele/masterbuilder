import { StorageService } from './storageService';

/**
 * Legacy local bootstrap helper.
 * Do not create fake sessions — Firestore rules require a real Firebase Auth user.
 */
export class DataInitializationService {
  static initializeAllData(): void {
    // Intentionally empty. Session must come from Firebase Auth sign-in.
  }

  static initializeUsers(): void {
    // Previously planted a demo fellow in localStorage without Auth,
    // which caused Firestore "Missing or insufficient permissions".
  }

  static resetAllData(): void {
    StorageService.clearSession();
  }
}
