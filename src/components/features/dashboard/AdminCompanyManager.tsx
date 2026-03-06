"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminDashboardContext } from "@/context/AdminDashboardContext";
import { Company, subsidiaries as Subsidiary } from "@/types";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Edit, Trash2, Search, ArrowUpDown, Plus, Globe, Building2, Phone, Mail, MapPin, Upload, Loader2, X } from "lucide-react";
import { companyService } from '@/services/companyService';

interface AdminCompanyManagerProps {
  onCompanySelect?: (company: Company | null) => void;
  selectedCompany?: Company | null;
}

export default function AdminCompanyManager({ onCompanySelect, selectedCompany }: AdminCompanyManagerProps) {
  const { data, loading, refresh } = useAdminDashboardContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Company>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 6;

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    phone_country_code: "+251",
    industry: "",
    location: "",
    logoUrl: "",
    website: "",
    size_range: "51-200",
    subsidiaries: [] as Subsidiary[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.name.trim()) newErrors.name = "Company name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formState.email && !emailRegex.test(formState.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formState.phone && !/^\d+$/.test(formState.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Phone number must contain only digits and spaces";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormState({
      name: "",
      email: "",
      phone: "",
      phone_country_code: "+251",
      industry: "",
      location: "",
      logoUrl: "",
      website: "",
      size_range: "51-200",
      subsidiaries: []
    });
    setErrors({});
    setEditingCompany(null);
  };

  useEffect(() => {
    if (editingCompany) {
      setFormState({
        name: editingCompany.name,
        email: editingCompany.contact_email || "",
        phone: editingCompany.phone || "",
        phone_country_code: "+251", // Default if not stored, or we could parse it
        industry: editingCompany.industry || "",
        location: editingCompany.location || "",
        logoUrl: editingCompany.logoUrl || "",
        website: editingCompany.website || "",
        size_range: editingCompany.size_range || "51-200",
        subsidiaries: editingCompany.subsidiaries || []
      });
    }
  }, [editingCompany]);

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    if (!data?.companies) return [];

    let filtered = data.companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return filtered;
  }, [data?.companies, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanies = filteredAndSortedCompanies.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateCompany = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = formState.phone ? `${formState.phone_country_code} ${formState.phone}` : "";

      await companyService.create({
        name: formState.name,
        contact_email: formState.email,
        phone: fullPhone,
        industry: formState.industry,
        location: formState.location,
        logoUrl: formState.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formState.name)}&background=1B4332&color=fff&size=256`,
        website: formState.website,
        size_range: formState.size_range,
        subsidiaries: formState.subsidiaries
      });

      await refresh();
      setIsCreateOpen(false);
      resetForm();
      // Optional: Add a success toast here if we had a toast library
    } catch (error) {
      console.error("Failed to create company:", error);
      alert("Failed to create company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = formState.phone ? `${formState.phone_country_code} ${formState.phone}` : "";

      await companyService.update(editingCompany.id, {
        name: formState.name,
        contact_email: formState.email,
        phone: fullPhone,
        industry: formState.industry,
        location: formState.location,
        logoUrl: formState.logoUrl,
        website: formState.website,
        size_range: formState.size_range,
        subsidiaries: formState.subsidiaries
      });

      await refresh();
      setIsUpdateOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to update company:", error);
      alert("Failed to update company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!editingCompany) return;

    const isMatched = deleteConfirmName.trim().toLowerCase() === editingCompany.name.trim().toLowerCase();
    if (!isMatched) {
      alert("Company name does not match. Please type the exact name to confirm.");
      return;
    }

    setIsSubmitting(true);
    try {
      await companyService.delete(editingCompany.id);
      await refresh();
      setIsDeleteOpen(false);
      setDeleteConfirmName("");
      setEditingCompany(null);
      if (onCompanySelect) onCompanySelect(null);
    } catch (error) {
      console.error("Failed to delete company:", error);
      alert("Failed to delete company. It might have linked data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety check: Ensure name is present for file path generation
    if (!formState.name) {
      alert("Please enter the company name first so we can organize the file correctly.");
      return;
    }

    console.log("UI: Starting logo upload flow for:", file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalBlob: Blob | File = file;

      // 1. Process/Compress (Skip for SVGs)
      if (file.type === 'image/svg+xml') {
        console.log("UI: SVG detected, skipping compression");
        setUploadProgress(10);
      } else {
        console.log("UI: Starting compression phase...");
        setUploadProgress(5);
        finalBlob = await companyService.compressLogo(file);
        console.log("UI: Compression complete");
        setUploadProgress(10);
      }

      // 2. Upload with progress tracking
      console.log("UI: Starting Firebase upload phase...");
      const url = await companyService.uploadLogo(
        finalBlob,
        formState.name,
        (progress) => {
          // Map 0-100% upload to 10-100% UI progress
          const uiProgress = 10 + (progress * 0.9);
          console.log(`UI: Upload progress updated: ${Math.floor(uiProgress)}%`);
          setUploadProgress(Math.floor(uiProgress));
        }
      );

      console.log("UI: Upload successful, URL:", url);
      setFormState(prev => ({ ...prev, logoUrl: url }));
      setUploadProgress(100);

      // Delay resetting to show 100% success state
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);

    } catch (error: any) {
      console.error("UI: Logo upload failed error details:", error);
      setIsUploading(false);
      setUploadProgress(0);

      // Provide user-friendly feedback based on error type
      let message = "Failed to upload logo.";
      if (error.code === 'storage/unauthorized') {
        message += " You do not have permission to upload. Please check Firebase Storage rules.";
      } else if (error.message?.includes('bucket')) {
        message += " Invalid storage bucket configuration. Please check your .env file.";
      } else {
        message += " Please check your browser console (F12) for technical details.";
      }
      alert(message);
    }
  };

  const addSubsidiary = () => {
    setFormState(prev => ({
      ...prev,
      subsidiaries: [
        ...prev.subsidiaries,
        {
          id: `sub-${Date.now()}`,
          name: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }));
  };

  const updateSubsidiary = (index: number, field: keyof Subsidiary, value: string) => {
    const updated = [...formState.subsidiaries];
    updated[index] = { ...updated[index], [field]: value, updated_at: new Date().toISOString() };
    setFormState(prev => ({ ...prev, subsidiaries: updated }));
  };

  const removeSubsidiary = (index: number) => {
    setFormState(prev => ({
      ...prev,
      subsidiaries: prev.subsidiaries.filter((_, i) => i !== index)
    }));
  };

  if (loading && !data?.companies) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading companies...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-10 px-6 gap-2 bg-[#1B4332] hover:bg-[#1B4332]/90">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create new company</DialogTitle>
              <DialogDescription>Initialize a new organization partner for the platform.</DialogDescription>
            </DialogHeader>
            <CompanyForm
              formState={formState}
              setFormState={setFormState}
              addSubsidiary={addSubsidiary}
              updateSubsidiary={updateSubsidiary}
              removeSubsidiary={removeSubsidiary}
              onLogoUpload={handleLogoUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              errors={errors}
            />
            <DialogFooter className="mt-6">
              <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button className="rounded-xl bg-[#1B4332] px-8" onClick={handleCreateCompany} disabled={isUploading || isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Table */}
      <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">
                <button className="flex items-center gap-2 hover:text-foreground transition-colors" onClick={() => { setSortField("name"); setSortDirection(prev => prev === "asc" ? "desc" : "asc"); }}>
                  Organization <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Contact Detail</TableHead>
              <TableHead>Industry / Scale</TableHead>
              <TableHead>Subsidiaries</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCompanies.map((company) => (
              <TableRow
                key={company.id}
                className={cn(
                  "group transition-all hover:bg-muted/30 cursor-pointer",
                  selectedCompany?.id === company.id && "bg-[#1B4332]/5 border-l-4 border-l-[#1B4332]"
                )}
                onClick={() => onCompanySelect?.(company)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center">
                      <img
                        src={company.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=1B4332&color=fff`}
                        alt={company.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-[#1B4332] transition-colors">{company.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {company.location || 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {company.contact_email}
                    </div>
                    {company.website && (
                      <div className="text-xs flex items-center gap-2 text-[#1B4332]">
                        <Globe className="h-3 w-3" /> {company.website.replace(/^https?:\/\//, '')}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{company.industry || 'General'}</div>
                    <div className="text-xs text-muted-foreground">{company.size_range || 'Unknown'} scale</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{company.subsidiaries?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2 transition-all">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                      onClick={() => onCompanySelect?.(company)}
                      title="Select Company"
                    >
                      <Building2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                      onClick={() => { setEditingCompany(company); setIsUpdateOpen(true); }}
                      title="Edit Profile"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                      onClick={() => { setEditingCompany(company); setIsDeleteOpen(true); }}
                      title="Remove Partner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Displaying {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedCompanies.length)} of {filteredAndSortedCompanies.length} organizations
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={cn("cursor-pointer h-9 rounded-lg", currentPage === 1 && "pointer-events-none opacity-50")} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer h-9 w-9 rounded-lg">
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={cn("cursor-pointer h-9 rounded-lg", currentPage === totalPages && "pointer-events-none opacity-50")} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={(open) => { setIsUpdateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-[#1B4332]">Update {editingCompany?.name}</DialogTitle>
            <DialogDescription>Modify organization profile and subsidiary details.</DialogDescription>
          </DialogHeader>
          <CompanyForm
            formState={formState}
            setFormState={setFormState}
            addSubsidiary={addSubsidiary}
            updateSubsidiary={updateSubsidiary}
            removeSubsidiary={removeSubsidiary}
            onLogoUpload={handleLogoUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            errors={errors}
          />
          <DialogFooter className="mt-6">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsUpdateOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="rounded-xl bg-[#1B4332] px-8" onClick={handleUpdateCompany} disabled={isUploading || isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) { setEditingCompany(null); setDeleteConfirmName(""); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive font-display">Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action strictly removes the organization and all profile meta. Existing fellow progress will remain but will be orphaned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm">Type <span className="font-bold underline">{editingCompany?.name}</span> to confirm.</p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Confirm organization name"
              className="rounded-xl border-destructive/30 focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Back</Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDeleteCompany}
              disabled={deleteConfirmName !== editingCompany?.name || isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyForm({ formState, setFormState, addSubsidiary, updateSubsidiary, removeSubsidiary, onLogoUpload, isUploading, uploadProgress, errors }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8 py-4">
      {/* Primary Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#1B4332]/70">Core Identity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Legal Name</label>
            <Input
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="e.g. MEDROC Investment Group"
              className={cn("rounded-xl", errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry Vertical</label>
            <Input
              value={formState.industry}
              onChange={(e) => setFormState({ ...formState, industry: e.target.value })}
              placeholder="e.g. Mining & Energy"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Communication */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#1B4332]/70">Contact & Digital</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Official Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                placeholder="contact@company.com"
                className={cn("rounded-xl pl-10", errors.email && "border-destructive")}
              />
            </div>
            {errors.email && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formState.website}
                onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                placeholder="https://company.com"
                className="rounded-xl pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Phone</label>
            <div className="flex gap-2">
              <select
                value={formState.phone_country_code}
                onChange={(e) => setFormState({ ...formState, phone_country_code: e.target.value })}
                className="h-10 rounded-xl border border-input px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-24"
              >
                <option value="+251">🇪🇹 +251</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+254">🇰🇪 +254</option>
              </select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formState.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s]/g, '');
                    setFormState({ ...formState, phone: val });
                  }}
                  placeholder="11 123 4567"
                  className={cn("rounded-xl pl-10", errors.phone && "border-destructive")}
                />
              </div>
            </div>
            {errors.phone && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.phone}</p>}
            <p className="text-[10px] text-muted-foreground">Numbers and spaces only.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formState.location}
                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                placeholder="City, Country"
                className="rounded-xl pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual & Scale */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#1B4332]/70">Scale & Branding</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Size</label>
            <select
              value={formState.size_range}
              onChange={(e) => setFormState({ ...formState, size_range: e.target.value })}
              className="w-full h-10 rounded-xl border border-input px-3 py-2 text-sm ring-offset-background bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="1-10">1-10 Employees</option>
              <option value="11-50">11-50 Employees</option>
              <option value="51-200">51-200 Employees</option>
              <option value="201-500">201-500 Employees</option>
              <option value="500+">500+ Employees</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-sm font-medium">Organization Logo</label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 min-w-[64px] rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center relative group shadow-inner">
                  {formState.logoUrl ? (
                    <>
                      <img
                        src={formState.logoUrl}
                        alt="Logo Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formState.name || 'C')}&background=1B4332&color=fff`;
                        }}
                      />
                      <button
                        onClick={() => setFormState({ ...formState, logoUrl: "" })}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onLogoUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button
                    variant="outline"
                    className="w-full rounded-xl gap-2 border-dashed h-16 text-muted-foreground hover:text-[#1B4332] relative overflow-hidden bg-muted/5 group/upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !formState.name}
                  >

                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Or use direct image URL</span>
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    value={formState.logoUrl}
                    onChange={(e) => setFormState({ ...formState, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="rounded-xl pl-10 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subsidiaries Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#1B4332]/70">Subsidiaries / Departments</h3>
          <Button variant="outline" size="sm" className="rounded-lg h-8 gap-1 text-xs" onClick={addSubsidiary}>
            <Plus className="h-3 w-3" /> Add Subsidiary
          </Button>
        </div>

        <div className="space-y-3">
          {formState.subsidiaries.map((sub: Subsidiary, index: number) => (
            <div key={sub.id} className="flex gap-2 items-end bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Subsidiary Name</label>
                <Input
                  value={sub.name}
                  onChange={(e) => updateSubsidiary(index, "name", e.target.value)}
                  placeholder="e.g. MEDROC Mining S.C."
                  className="rounded-lg h-9"
                />
              </div>
              <div className="w-[120px] space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Industry Scale</label>
                <select
                  value={sub.size_range}
                  onChange={(e) => updateSubsidiary(index, "size_range", e.target.value)}
                  className="w-full h-9 rounded-lg border border-input px-2 py-1 text-xs bg-background"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                onClick={() => removeSubsidiary(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {formState.subsidiaries.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
              No subsidiaries listed for this organization.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

