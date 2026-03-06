import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quizQueue = [
  {
    id: "quiz-01",
    title: "Communication Excellence - Knowledge Check",
    company: "Sunstone Manufacturing",
    passRate: "84%",
    attempts: 24,
  },
  {
    id: "quiz-02",
    title: "Supply Chain Readiness - Scenario Quiz",
    company: "NileCraft Logistics",
    passRate: "79%",
    attempts: 19,
  },
  {
    id: "quiz-03",
    title: "Leadership Foundations - Progress Quiz",
    company: "Aurora Health Initiative",
    passRate: "91%",
    attempts: 31,
  },
];

export default function AdminQuizEvaluationTab() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Quiz Evaluation</p>
        <h1 className="text-3xl font-display text-foreground">Quiz performance tracking</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-3xl">
          Monitor quiz pass rates, remediation needs, and instructor follow-ups by cohort.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Quiz review queue</CardTitle>
          <CardDescription className="text-muted-foreground">
            Prioritize cohorts that need additional coaching or content reinforcement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="py-3">Quiz</th>
                  <th className="py-3">Company</th>
                  <th className="py-3">Pass rate</th>
                  <th className="py-3">Attempts</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quizQueue.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="py-4 text-foreground">{quiz.title}</td>
                    <td className="py-4">{quiz.company}</td>
                    <td className="py-4">{quiz.passRate}</td>
                    <td className="py-4">{quiz.attempts}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-full">
                          Review items
                        </Button>
                        <Button size="sm" className="rounded-full">Assign coaching</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pass threshold</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">80%</p>
              <p className="text-xs text-muted-foreground">Program standard</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Average score</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">83%</p>
              <p className="text-xs text-muted-foreground">Across active cohorts</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Remediation needed</p>
              <p className="mt-3 text-2xl font-semibold text-amber-300">6 quizzes</p>
              <p className="text-xs text-muted-foreground">Below 80% pass rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}


