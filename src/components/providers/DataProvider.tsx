"use client";

import React, { useEffect } from 'react';
import { DataInitializationService } from '@/services/dataInitialization';

export function DataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize sample data on client mount if it doesn't exist
    DataInitializationService.initializeAllData();
  }, []);

  return <>{children}</>;
}
