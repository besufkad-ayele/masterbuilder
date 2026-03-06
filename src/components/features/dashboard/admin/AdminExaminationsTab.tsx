"use client";

import { useState, useEffect } from "react";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, FileText, ChevronRight, BookOpen } from "lucide-react";
import { ExamService, Exam, ExamQuestion } from "@/services/ExamService";
import { CohortService } from "@/services/CohortService";
import { Competency, Wave, WaveCompetency } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminExaminationsTab() {
  const { data: dashboardData, loading: dashboardLoading } = useAdminDashboard();
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>("");
  const [availableCompetencies, setAvailableCompetencies] = useState<Competency[]>([]);

  const [activeExam, setActiveExam] = useState<Partial<Exam> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);

  // Fetch competencies for the selected cohort
  useEffect(() => {
    const fetchCohortCompetencies = async () => {
      if (!selectedCohortId) {
        setAvailableCompetencies([]);
        return;
      }

      try {
        const waves = await CohortService.getWavesByCohort(selectedCohortId);
        const allWaveCompsPromises = waves.map(w => CohortService.getWaveCompetencies(w.id));
        const allWaveCompsResults = await Promise.all(allWaveCompsPromises);

        const compIds = Array.from(new Set(allWaveCompsResults.flat().map(wc => wc.competency_id)));
        const cohortComps = (dashboardData?.competencies || []).filter(c => compIds.includes(c.id));

        setAvailableCompetencies(cohortComps);
      } catch (error) {
        console.error("Error fetching cohort competencies:", error);
      }
    };

    fetchCohortCompetencies();
  }, [selectedCohortId, dashboardData?.competencies]);

  // Fetch existing exam when competency is selected
  useEffect(() => {
    const fetchExam = async () => {
      if (!selectedCohortId || !selectedCompetencyId) {
        setActiveExam(null);
        return;
      }

      setIsLoadingExam(true);
      try {
        const exams = await ExamService.getExamsByCohortAndCompetency(selectedCohortId, selectedCompetencyId);
        if (exams.length > 0) {
          setActiveExam(exams[0]);
        } else {
          setActiveExam({
            cohort_id: selectedCohortId,
            competency_id: selectedCompetencyId,
            title: `Final Exam: ${availableCompetencies.find(c => c.id === selectedCompetencyId)?.title || "Competency"}`,
            questions: []
          });
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setIsLoadingExam(false);
      }
    };

    fetchExam();
  }, [selectedCohortId, selectedCompetencyId, availableCompetencies]);

  const handleAddQuestion = () => {
    if (!activeExam) return;
    const newQuestion: ExamQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: "",
      options: ["", "", "", ""],
      correct_option_index: 0
    };
    setActiveExam({
      ...activeExam,
      questions: [...(activeExam.questions || []), newQuestion]
    });
  };

  const handleRemoveQuestion = (id: string) => {
    if (!activeExam) return;
    setActiveExam({
      ...activeExam,
      questions: (activeExam.questions || []).filter(q => q.id !== id)
    });
  };

  const handleUpdateQuestion = (id: string, updates: Partial<ExamQuestion>) => {
    if (!activeExam) return;
    setActiveExam({
      ...activeExam,
      questions: (activeExam.questions || []).map(q => q.id === id ? { ...q, ...updates } : q)
    });
  };

  const handleSaveExam = async () => {
    if (!activeExam || !selectedCohortId || !selectedCompetencyId) return;

    setIsSaving(true);
    try {
      await ExamService.createOrUpdateExam(activeExam);
      alert("Exam saved successfully!");
    } catch (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam.");
    } finally {
      setIsSaving(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Academic Control</p>
        <h1 className="text-5xl font-serif font-bold text-foreground">Examinations</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Create and manage competency-linked exams for specific cohorts. Link evaluations directly to the learning path.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-serif">Assessment Link</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Cohort</label>
                <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardData?.cohorts.map(cohort => (
                      <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Competency</label>
                <Select
                  value={selectedCompetencyId}
                  onValueChange={setSelectedCompetencyId}
                  disabled={!selectedCohortId}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Competency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompetencies.map(comp => (
                      <SelectItem key={comp.id} value={comp.id}>{comp.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {activeExam && (
            <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Structure</p>
                    <p className="font-bold text-lg">{activeExam.questions?.length || 0} Questions</p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveExam}
                  disabled={isSaving || !activeExam.questions?.length}
                  className="w-full h-12 rounded-2xl bg-[#1B4332] text-white font-bold"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                  Publish Exam
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Exam Editor */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedCohortId || !selectedCompetencyId ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-12 bg-white/40 backdrop-blur-sm rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
              <BookOpen className="size-16 text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-serif font-bold text-muted-foreground mb-2">Select Target to Begin</h3>
              <p className="text-muted-foreground max-w-sm">Choose a cohort and competency from the sidebar to create or edit the final examination questions.</p>
            </div>
          ) : isLoadingExam ? (
            <div className="h-[50vh] flex items-center justify-center">
              <Loader2 className="size-12 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Input
                    value={activeExam?.title || ""}
                    onChange={e => setActiveExam(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-2xl font-serif font-bold h-auto py-2 bg-transparent border-none focus-visible:ring-0 px-0"
                    placeholder="Exam Title"
                  />
                  <p className="text-xs text-muted-foreground">Editing examination content for {availableCompetencies.find(c => c.id === selectedCompetencyId)?.title}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddQuestion}
                  className="rounded-2xl h-12 px-6 border-[#E8E4D8] text-primary font-bold hover:bg-primary/5"
                >
                  <Plus className="size-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {activeExam?.questions?.map((question, index) => (
                  <Card key={question.id} className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden group">
                    <CardHeader className="bg-muted/30 py-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-[#E8E4D8]">
                          {index + 1}
                        </div>
                        <CardTitle className="text-sm">Question Block</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question Text</label>
                        <Input
                          value={question.text}
                          onChange={e => handleUpdateQuestion(question.id, { text: e.target.value })}
                          placeholder="Enter the question text..."
                          className="rounded-xl border-[#E8E4D8]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Option {String.fromCharCode(65 + optIndex)}</label>
                              <button
                                onClick={() => handleUpdateQuestion(question.id, { correct_option_index: optIndex })}
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all",
                                  question.correct_option_index === optIndex
                                    ? "bg-emerald-500 text-white"
                                    : "bg-muted text-muted-foreground hover:bg-[#E8E4D8]"
                                )}
                              >
                                {question.correct_option_index === optIndex ? "Correct Answer" : "Mark as Correct"}
                              </button>
                            </div>
                            <Input
                              value={option}
                              onChange={e => {
                                const newOptions = [...question.options];
                                newOptions[optIndex] = e.target.value;
                                handleUpdateQuestion(question.id, { options: newOptions });
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className={cn(
                                "rounded-xl border-[#E8E4D8]",
                                question.correct_option_index === optIndex && "border-emerald-500 ring-2 ring-emerald-500/10"
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {activeExam?.questions?.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground italic">
                    No questions added yet. Click "Add Question" to begin building this exam.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
