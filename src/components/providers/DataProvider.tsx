"use client";

import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DataInitializationService } from '@/services/dataInitialization';
import { StorageService } from '@/services/storageService';
import { auth } from '@/lib/firebase';

export function DataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    DataInitializationService.initializeAllData();

    // Drop stale localStorage sessions that aren't backed by Firebase Auth.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && StorageService.getCurrentUser()) {
        StorageService.clearSession();
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
