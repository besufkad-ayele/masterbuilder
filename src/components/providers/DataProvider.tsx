"use client";

import React, { useEffect } from 'react';
import { DataInitializationService } from '@/services/dataInitialization';
import { useSessionStore } from '@/stores/sessionStore';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    DataInitializationService.initializeAllData();
  }, [hydrate]);

  return <>{children}</>;
}
