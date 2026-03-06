import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  FileText,
  Users2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";



export default function AdminDashboardOverview() {
  const { data, loading, error } = useAdminDashboard();

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-destructive">
        Error loading dashboard: {error.message}
      </div>
    );
  }

  const totalCompanies = data?.companies?.length ?? 0;
  const totalFellows = data?.fellows?.length ?? 0;
  const totalCompetencies = data?.competencies?.length ?? 0;

  const totalCohorts = data?.cohorts?.length ?? 0;
  const totalFacilitators = data?.facilitators?.length ?? 0;

  const activeFellowsCount = (data?.fellows || []).filter(f => f.is_active || f.status === 'Active').length;
  const engagementRate = totalFellows > 0 ? Math.round((activeFellowsCount / totalFellows) * 100) : 0;

  const adminCards = [
    {
      title: "Active Company Agreements",
      description: "Onboarding readiness & signatures",
      value: totalCompanies,
      unit: "signed",
      icon: FileText,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accent: "text-emerald-600",
      bgAccent: "bg-emerald-50"
    },
    {
      title: "Live Cohorts",
      description: "Ongoing development cycles",
      value: totalCohorts,
      unit: "cohorts",
      icon: CalendarCheck,
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      accent: "text-blue-600",
      bgAccent: "bg-blue-50"
    },
    {
      title: "Fellow Engagement",
      description: "Weekly task completion rate",
      value: engagementRate,
      unit: "% active",
      icon: BarChart3,
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accent: "text-amber-600",
      bgAccent: "bg-amber-50"
    },
    {
      title: "Coaches & Mentors",
      description: "Active facilitators assigned",
      value: totalFacilitators,
      unit: "leads",
      icon: Users2,
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accent: "text-purple-600",
      bgAccent: "bg-purple-50"
    },
  ];



  const readinessRows = (data?.companies || []).map((company) => {
    const companyFellows = (data?.fellows || []).filter((f) => f.company_id === company.id);
    const companyCohort = (data?.cohorts || []).find((c) => c.company_id === company.id);
    const companyCompetencies = companyCohort ? (data?.competencies || []) : [];

    return {
      id: company.id,
      name: company.name,
      cohort: companyCohort?.name || "Not assigned",
      fellows: companyFellows.length,
      competencies: companyCompetencies.length,

      status: "Active",
    };
  });

  const cohortHealth = (data?.cohorts || []).map((cohort) => {
    const cohortFellows = (data?.fellows || []).filter((f) => f.cohort_id === cohort.id);
    const activeCohortFellows = cohortFellows.filter((f) => f.is_active || f.status === 'Active');
    const engagement = cohortFellows.length > 0
      ? Math.round((activeCohortFellows.length / cohortFellows.length) * 100)
      : 0;

    // Simulate portfolio velocity based on cohort name hash or random consistency
    const portfolio = 60 + (cohort.name.length * 7) % 35;

    let risk = "Low";
    if (engagement < 50) risk = "High";
    else if (engagement < 80) risk = "Moderate";

    return {
      name: cohort.name,
      companyCount: 1,
      engagement,
      portfolio,
      risk
    };
  });

  const workstreams = [
    {
      title: "Companies",
      description: "Manage agreements, cohorts, and readiness steps.",
      stat: `${totalCompanies} active`,
      href: "/admin?tab=companies",
    },
    {
      title: "Fellows",
      description: "Oversee enrollment, status, and profile health.",
      stat: `${totalFellows} active`,
      href: "/admin?tab=fellows",
    },
    {
      title: "Competencies",
      description: "Maintain the library and behavioral indicators.",
      stat: `${totalCompetencies} active`,
      href: "/admin?tab=competencies",
    },

  ];

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="text-3xl lg:text-4xl font-display text-foreground">Leadership Development program command center</h1>
          <p className="mt-2 text-base text-muted-foreground max-w-3xl">
            Monitor signed agreements, cohort progress, and partner readiness. Use this hub to coordinate
            approvals, coaching capacity, and stakeholder reporting.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => (
          <div
            key={card.title}
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] border-2 border-[#E8E4D8] bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/20",
              "group"
            )}
          >
            {/* Background Gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br -z-10 transition-opacity duration-500 opacity-60", card.gradient)} />

            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", card.bgAccent, "border-white shadow-sm")}>
                  <card.icon className={cn("size-7", card.accent)} />
                </div>
                {/* Visual indicator */}
                <div className="size-2 rounded-full bg-primary/20 animate-pulse" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B9B7E] transition-colors group-hover:text-primary">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-serif font-bold text-[#1B4332]">{card.value}</span>
                  <span className="text-sm font-serif italic text-[#8B9B7E]">{card.unit}</span>
                </div>
                <p className="text-xs text-[#8B9B7E]/80 font-serif italic line-clamp-1 group-hover:text-[#8B9B7E] transition-colors">
                  {card.description}
                </p>
              </div>
            </div>

            {/* Subtle decorative circle */}
            <div className="absolute -bottom-10 -right-10 size-32 rounded-full bg-[#1B4332]/5 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          </div>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Admin workstreams</CardTitle>
          <CardDescription className="text-muted-foreground">
            Jump directly to the management modules for companies, fellows, evaluations, and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workstreams.map((stream) => (
            <div key={stream.title} className="rounded-2xl border border-border bg-muted/50 p-4">
              <p className="text-sm font-semibold text-foreground">{stream.title}</p>
              <p className="text-xs text-muted-foreground mt-2">{stream.description}</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{stream.stat}</p>
              <Button asChild size="sm" variant="outline" className="mt-4 rounded-full">
                <Link href={stream.href}>Open module</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>


    </section>
  );
}
