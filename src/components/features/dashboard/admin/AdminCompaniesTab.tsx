"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminCompanyManager from "../AdminCompanyManager";
import { Company, FellowProfile, Cohort } from "@/types";
import { cn } from "@/lib/utils";
import { useAdminDashboardContext } from "@/context/AdminDashboardContext";
import { Building2, Users, GraduationCap, MapPin, Globe, Mail, Phone, ExternalLink, UserPlus } from "lucide-react";
import FellowCreationForm from "./FellowCreationForm";

function CompanyDetailDialog({
  company,
  fellows,
  cohorts
}: {
  company: Company;
  fellows: FellowProfile[];
  cohorts: Cohort[];
}) {
  const companyCohorts = cohorts.filter(c => c.company_id === company.id);
  const companyFellows = fellows.filter(f => f.company_id === company.id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl w-full h-10 gap-2 border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332]/5">
          <ExternalLink className="h-4 w-4" />
          View full dossier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-muted overflow-hidden border border-border flex items-center justify-center">
              <img
                src={company.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=1B4332&color=fff`}
                alt={company.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <DialogTitle className="text-2xl font-display text-[#1B4332]">{company.name}</DialogTitle>
              <DialogDescription className="text-base">
                Organization Profile & Ecosystem Overview
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 mt-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 rounded-2xl p-4 text-center">
              <Users className="h-5 w-5 text-[#1B4332] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1B4332]">{companyFellows.length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Fellows</div>
            </div>
            <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 rounded-2xl p-4 text-center">
              <GraduationCap className="h-5 w-5 text-[#1B4332] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1B4332]">{companyCohorts.length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Cohorts</div>
            </div>
            <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 rounded-2xl p-4 text-center">
              <Building2 className="h-5 w-5 text-[#1B4332] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#1B4332]">{company.subsidiaries?.length || 0}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Units</div>
            </div>
          </div>

          {/* Contact & Bio */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Communication</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#1B4332]" />
                  <span>{company.contact_email}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-[#1B4332]" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-[#1B4332]" />
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-[#1B4332] hover:underline">
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-[#1B4332]" />
                  <span>{company.location || 'Location not specified'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Vertical & Scale</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Industry</div>
                  <div className="font-medium">{company.industry || 'General Business'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Organization Size</div>
                  <div className="font-medium">{company.size_range || 'Unknown'} Employee Base</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subsidiaries */}
          {company.subsidiaries && company.subsidiaries.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Subsidiaries / Departments ({company.subsidiaries.length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {company.subsidiaries.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                    <span className="font-medium text-sm">{sub.name}</span>
                    <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border border-border text-muted-foreground uppercase">{sub.size_range || 'Med'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Cohorts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Active Cohorts ({companyCohorts.length})</h4>
              <FellowCreationForm
                initialCompanyId={company.id}
                onFellowCreated={() => { }} // Could refresh context if needed
                trigger={
                  <Button size="sm" variant="outline" className="h-8 rounded-lg gap-2 border-primary/20 text-primary hover:bg-primary/5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Onboard New Fellow
                  </Button>
                }
              />
            </div>
            <div className="space-y-2">
              {companyCohorts.map((cohort) => (
                <div key={cohort.id} className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#1B4332]">{cohort.name}</div>
                    <div className="text-xs text-muted-foreground">{cohort.wave_level} Level • {cohort.status}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg">View Details</Button>
                </div>
              ))}
              {companyCohorts.length === 0 && (
                <div className="text-center py-8 bg-muted/20 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                  No cohorts initialized for this organization yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCompaniesTab() {
  const { data, loading } = useAdminDashboardContext();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const stats = useMemo(() => {
    if (!data) return { companies: 0, fellows: 0, cohorts: 0 };
    return {
      companies: data.companies.length,
      fellows: data.fellows.length,
      cohorts: data.cohorts.length
    };
  }, [data]);

  return (
    <section className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#1B4332] font-bold">Organization Ecosystem</p>
          <h1 className="text-4xl font-display text-foreground tracking-tight">Partners & Governance</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Architecting the growth of your corporate partners. Manage company profiles, verify legal hierarchies, and monitor cohort distribution.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white border border-border rounded-2xl py-3 px-6 shadow-sm">
            <div className="text-2xl font-display text-[#1B4332]">{stats.companies}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Partners</div>
          </div>
          <div className="bg-white border border-border rounded-2xl py-3 px-6 shadow-sm">
            <div className="text-2xl font-display text-[#1B4332]">{stats.cohorts}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Cohorts</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px] lg:grid-cols-1">
        {/* Company Management - Left Side */}
        <Card className="bg-card border-border shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-0 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between py-2">
              <div>
                <CardTitle className="text-xl font-display text-[#1B4332]">Partner Index</CardTitle>
                <CardDescription>
                  Full database of active and onboarding regular partners.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <AdminCompanyManager onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
          </CardContent>
        </Card>

        {/* Company Detail - Right Side (Sticky) */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm rounded-3xl sticky top-8 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border">
              <CardTitle className="text-lg font-display text-[#1B4332]">Operational Context</CardTitle>
              <CardDescription>
                Detailed overview of selected partner.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {selectedCompany ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                      <img
                        src={selectedCompany.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCompany.name)}&background=1B4332&color=fff`}
                        alt={selectedCompany.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-display text-[#1B4332] leading-none mb-1">{selectedCompany.name}</h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Building2 className="h-3 w-3" /> {selectedCompany.industry || 'General Partner'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">Scale</div>
                      <div className="font-semibold">{selectedCompany.size_range || 'N/A'}</div>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">Units</div>
                      <div className="font-semibold">{selectedCompany.subsidiaries?.length || 0}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> Fellows
                      </span>
                      <span className="font-semibold text-foreground">
                        {data?.fellows.filter(f => f.company_id === selectedCompany.id).length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Active Cohorts
                      </span>
                      <span className="font-semibold text-foreground">
                        {data?.cohorts.filter(c => c.company_id === selectedCompany.id).length || 0}
                      </span>
                    </div>
                  </div>

                  <CompanyDetailDialog
                    company={selectedCompany}
                    fellows={data?.fellows || []}
                    cohorts={data?.cohorts || []}
                  />
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-border">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#1B4332]">No Selection</p>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                      Select an organization from the index to view its operational blueprint.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}


