import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-dashboard";

export default function AdminPerformanceTab() {
  const { data, loading } = useAdminDashboard();

  if (loading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Performance</p>
        <h1 className="text-3xl font-display text-foreground">Cohort performance reporting</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-3xl">
          Review mastery progress, competency coverage, and performance trends across cohorts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Curriculum focus</CardTitle>
            <CardDescription className="text-muted-foreground">
              Active competency mix across organizations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.competencies.slice(0, 5).map((competency) => (
              <div key={competency.id} className="rounded-2xl border border-border bg-muted/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{competency.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Level: {competency.level}
                </p>
                {/* Fallback for indicators as they might be in a separate collection or related */}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Cohort performance snapshot</CardTitle>
            <CardDescription className="text-muted-foreground">Progress by learning phase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Believe completion", value: 92, color: "bg-emerald-400" },
              { label: "Know mastery", value: 81, color: "bg-amber-400" },
              { label: "Do execution", value: 67, color: "bg-rose-400" },
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{metric.label}</span>
                  <span>{metric.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div className={`h-2 rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Executive note</p>
              <p className="mt-3">
                Cohort B shows the strongest mastery in Believe and Know phases. Recommend targeted coaching
                for Do phase simulations in Cohort A.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

