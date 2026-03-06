"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Users, Building2, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAdminDashboardContext } from '@/context/AdminDashboardContext';
import { Cohort } from '@/types';
import LoadingSpinner from '@/components/ui/loading-spinner';
import CohortCreationForm from './CohortCreationForm';
import CohortEditForm from './CohortEditForm';
import { CohortService } from '@/services/CohortService';

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────

interface DeleteCohortDialogProps {
  cohort: Cohort;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteCohortDialog({ cohort, onClose, onDeleted }: DeleteCohortDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await CohortService.deleteCohort(cohort.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete cohort.');
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-serif">Delete Cohort</DialogTitle>
          </div>
          <DialogDescription>
            This will permanently delete <strong>{cohort.name}</strong>, its waves, wave competencies,
            and un-assign all enrolled fellows. <br />
            <span className="text-destructive font-semibold">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

const AdminCohortsTab = () => {
  const { data, loading, refresh } = useAdminDashboardContext();
  const cohorts = data?.cohorts || [];
  const companies = data?.companies || [];

  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<Cohort | null>(null);

  if (loading) return <LoadingSpinner />;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-stone-100 text-stone-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWaveLevelColor = (level: string) => {
    switch (level) {
      case 'Basic': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      case 'Expert': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fmt = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  return (
    <div className="space-y-8">

      {/* Edit form (full screen modal) */}
      {editingCohort && (
        <CohortEditForm
          cohort={editingCohort}
          onClose={() => setEditingCohort(null)}
          onSaved={refresh}
        />
      )}

      {/* Delete confirmation */}
      {deletingCohort && (
        <DeleteCohortDialog
          cohort={deletingCohort}
          onClose={() => setDeletingCohort(null)}
          onDeleted={refresh}
        />
      )}

      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cohorts</p>
        <h1 className="text-3xl font-display text-foreground">Cohort Management</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-3xl">
          Create and manage learning cohorts with customized competencies and enrollment settings.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-foreground">Active Cohorts</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage cohort configurations and enrollment
              </CardDescription>
            </div>
            <CohortCreationForm onCohortCreated={() => refresh()} />
          </div>
        </CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground italic text-sm">
              No cohorts yet. Click <strong>Create New Cohort</strong> to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {cohorts.map((cohort) => {
                const company = companies.find(c => c.id === cohort.company_id);
                return (
                  <div
                    key={cohort.id}
                    className="border rounded-2xl p-6 space-y-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold truncate">{cohort.name}</h3>
                          <Badge className={getStatusColor(cohort.status)}>
                            {cohort.status}
                          </Badge>
                          <Badge className={getWaveLevelColor(cohort.wave_level)}>
                            {cohort.wave_level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Building2 className="size-4 shrink-0" />
                            <span>{company?.name || cohort.company_id}</span>
                          </div>
                          {cohort.capacity && (
                            <div className="flex items-center gap-1">
                              <Users className="size-4 shrink-0" />
                              <span>{cohort.capacity} capacity</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="size-4 shrink-0" />
                            <span>{fmt(cohort.start_date)} → {fmt(cohort.end_date)}</span>
                          </div>
                          <span className="text-xs uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full">
                            {cohort.enrollment_mode?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          id={`edit-cohort-${cohort.id}`}
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setEditingCohort(cohort)}
                        >
                          <Edit className="size-3.5 mr-1.5" /> Edit
                        </Button>
                        <Button
                          id={`delete-cohort-${cohort.id}`}
                          size="sm"
                          variant="outline"
                          className="rounded-full text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                          onClick={() => setDeletingCohort(cohort)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCohortsTab;
