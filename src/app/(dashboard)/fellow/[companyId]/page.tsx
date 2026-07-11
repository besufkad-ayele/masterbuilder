"use client";

import React, { Suspense } from 'react';
import { StorageService } from '@/services/storageService';
import FellowDashboardLayout from '@/components/features/dashboard/fellow/FellowDashboardLayout';

export default function FellowPage() {
  // Get the current user from storage
  React.useEffect(() => {
    const currentUser = StorageService.getCurrentUser();
    const token = StorageService.getAuthToken();
    if (!currentUser || !token || currentUser.role !== 'FELLOW') {
      window.location.replace('/');
      return;
    }
    setFellowId(currentUser.id);
  }, []);

  const [fellowId, setFellowId] = React.useState<string | null>(null);

  if (!fellowId) return null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FellowDashboardLayout fellowId={fellowId} />
    </Suspense>
  );
}
