"use client";

import React, { useState, useEffect } from "react";
import { StorageService } from "@/services/storageService";
import { FacilitatorService } from "@/services/FacilitatorService";
import ChangePasswordForm from "@/components/features/dashboard/admin/ChangePasswordForm";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Pencil,
  BadgeCheck,
  Calendar,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequiredMark } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FacilitatorAccount = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  bio?: string;
  department?: string;
  created_at?: string;
};

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  const hasValue = Boolean(value?.trim());
  return (
    <div className="flex gap-3 rounded-xl border border-border/80 bg-background px-3.5 py-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-sm font-medium",
            hasValue ? "text-foreground" : "italic text-muted-foreground/70",
          )}
        >
          {hasValue ? value : "Not set"}
        </p>
      </div>
    </div>
  );
}

const FacilitatorProfileTab: React.FC = () => {
  const [user, setUser] = useState<FacilitatorAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  const loadProfile = async () => {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const facilitators = await FacilitatorService.getAllFacilitators();
      const profile = facilitators.find((f) => f.user_id === currentUser.id);

      if (profile) {
        setUser({
          id: profile.id,
          user_id: currentUser.id,
          name: profile.full_name || currentUser.name,
          email: profile.email || currentUser.email,
          role: currentUser.role,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          department: profile.department,
          created_at: profile.created_at,
        });
      } else {
        setUser({
          id: currentUser.id,
          user_id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          created_at: currentUser.created_at,
        });
      }
    } catch (error) {
      console.error("Error fetching facilitator profile:", error);
      setUser({
        id: currentUser.id,
        user_id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        created_at: currentUser.created_at,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const openEdit = () => {
    if (!user) return;
    setEditData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      location: user.location || "",
      bio: user.bio || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    try {
      await FacilitatorService.updateFacilitator(user.id, user.user_id, {
        full_name: editData.name,
        email: editData.email,
        phone: editData.phone,
        location: editData.location,
        bio: editData.bio,
      });
      setIsEditOpen(false);
      setLoading(true);
      await loadProfile();
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <h3 className="text-lg font-semibold text-foreground">Profile not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in again to load your account details.
        </p>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joinedLabel = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Account Settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage your personal details and keep your account secure.
          </p>
        </div>
        <Button type="button" onClick={openEdit} className="mt-3 h-10 gap-2 self-start sm:mt-0">
          <Pencil className="size-3.5" />
          Edit profile
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <Avatar className="size-16 rounded-2xl border border-border sm:size-20">
            <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-semibold text-primary sm:text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-foreground">{user.name}</h2>
              <Badge
                variant="secondary"
                className="gap-1 rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
              >
                <BadgeCheck className="size-3" />
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Facilitator
              {user.department ? ` · ${user.department}` : null}
              {joinedLabel ? ` · Joined ${joinedLabel}` : null}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Profile details</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Contact and identity information for your account.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field icon={Mail} label="Email" value={user.email} />
            <Field icon={Phone} label="Phone" value={user.phone} />
            <Field icon={MapPin} label="Location" value={user.location} />
            <Field icon={Building2} label="Department" value={user.department} />
            <Field icon={Shield} label="Role" value="Facilitator" />
            {joinedLabel && <Field icon={Calendar} label="Member since" value={joinedLabel} />}
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Bio
            </p>
            <p
              className={cn(
                "mt-1 text-sm leading-relaxed",
                user.bio?.trim() ? "text-foreground" : "italic text-muted-foreground/70",
              )}
            >
              {user.bio?.trim() || "No bio added yet. Use Edit profile to introduce yourself."}
            </p>
          </div>
        </section>

        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-2xl sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update the details shown on your account settings page.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Full name
                <RequiredMark className="ml-0.5" />
              </label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
                <RequiredMark className="ml-0.5" />
              </label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                required
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className="min-h-[96px] resize-none"
                placeholder="A short introduction..."
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="h-10">
                {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilitatorProfileTab;
