import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPortfolioEvaluationTab() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Portfolio Evaluation</p>
        <h1 className="text-3xl font-display text-foreground">Portfolio review control center</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-3xl">
          Manage portfolio submissions, review velocity, and mentor feedback loops for Fellows.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Portfolio evaluation loop</CardTitle>
            <CardDescription className="text-muted-foreground">
              Track review velocity and evidence quality across cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" /> Smooth
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" /> Friction
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-400" /> Stuck
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Basics (Know)</p>
                <p className="mt-3 text-2xl font-semibold text-emerald-300">92%</p>
                <p className="text-xs text-muted-foreground">On-time reviews</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Intermediate (Do)</p>
                <p className="mt-3 text-2xl font-semibold text-amber-300">64%</p>
                <p className="text-xs text-muted-foreground">Needs coaching input</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Advanced (Build)</p>
                <p className="mt-3 text-2xl font-semibold text-rose-300">28%</p>
                <p className="text-xs text-muted-foreground">Awaiting escalation</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Active build evidence review</p>
              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Stakeholder Alignment Matrix</p>
                  <p className="text-xs text-muted-foreground">Submitted by Marcus Thorne - 2.4 MB PDF</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-full">
                      View artifact
                    </Button>
                    <Button size="sm" className="rounded-full">Approve &amp; Advance</Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Mentor feedback</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Evidence demonstrates high alignment with "Stakeholder Empathy" criteria. Recommend
                    score 85/100.
                  </p>
                  <Button size="sm" variant="outline" className="mt-4 rounded-full">
                    Request iteration
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Reviewer profile</CardTitle>
            <CardDescription className="text-muted-foreground">Live evaluator details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center text-foreground text-2xl font-semibold">
                MT
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Marcus Thorne</p>
                <p className="text-xs text-muted-foreground">Senior Analyst - Level 3 Candidate</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300 px-3 py-1 text-xs text-emerald-700">
                  Cohort 2024-B
                </span>
                <span className="rounded-full border border-amber-300 px-3 py-1 text-xs text-amber-700">
                  Top 10% performer
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Current competency spider</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Know (Curriculum)</span>
                  <span>90%</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div className="h-2 rounded-full bg-emerald-400" style={{ width: "90%" }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Do (Simulations)</span>
                  <span>62%</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: "62%" }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Build (Portfolio)</span>
                  <span>45%</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div className="h-2 rounded-full bg-rose-400" style={{ width: "45%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


