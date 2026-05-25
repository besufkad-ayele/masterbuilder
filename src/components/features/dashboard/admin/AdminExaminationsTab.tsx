"use client";

import { useState, useEffect } from "react";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Save, FileText, ChevronRight, BookOpen, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { ExamService, Exam, ExamQuestion } from "@/services/ExamService";
import { CohortService } from "@/services/CohortService";
import { FellowProgressService } from "@/services/FellowProgressService";
import { Competency, Wave, WaveCompetency } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminExaminationsTab() {
  const { data: dashboardData, loading: dashboardLoading } = useAdminDashboard();
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>("");
  const [availableCompetencies, setAvailableCompetencies] = useState<Competency[]>([]);
  const [competencyExams, setCompetencyExams] = useState<Record<string, Exam>>({});

  const [activeExam, setActiveExam] = useState<Partial<Exam> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [view, setView] = useState<"grid" | "editor">("grid");

  // Fetch competencies and their exams for the selected cohort
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!selectedCohortId) {
        setAvailableCompetencies([]);
        setCompetencyExams({});
        setView("grid");
        return;
      }

      setIsLoadingGrid(true);
      try {
        // 1. Fetch waves for this cohort
        const waves = await CohortService.getWavesByCohort(selectedCohortId);
        
        // 2. Fetch all competency mappings for these waves
        const allWaveCompsPromises = waves.map(w => CohortService.getWaveCompetencies(w.id));
        const allWaveCompsResults = await Promise.all(allWaveCompsPromises);

        // 3. Extract unique competency IDs
        const compIds = Array.from(new Set(allWaveCompsResults.flat().map(wc => wc.competency_id)));
        
        // 4. Fetch ALL competencies (Master + Library) to ensure we don't miss any
        const allComps = await FellowProgressService.getAllCompetencies();
        const cohortComps = allComps.filter(c => compIds.includes(c.id));

        setAvailableCompetencies(cohortComps);

        // 5. Fetch all exams for this cohort to show status in the grid
        const exams = await ExamService.getExamsByCohort(selectedCohortId);
        const examMap: Record<string, Exam> = {};
        exams.forEach(e => {
          examMap[e.competency_id] = e;
        });
        setCompetencyExams(examMap);
      } catch (error) {
        console.error("Error fetching cohort data:", error);
      } finally {
        setIsLoadingGrid(false);
      }
    };

    fetchCohortData();
  }, [selectedCohortId]);

  // Fetch existing exam when competency is selected for editing
  useEffect(() => {
    const fetchExam = async () => {
      if (!selectedCohortId || !selectedCompetencyId || view !== "editor") {
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
            questions: [],
            is_portal_open: false
          });
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setIsLoadingExam(false);
      }
    };

    fetchExam();
  }, [selectedCohortId, selectedCompetencyId, view, availableCompetencies]);

  const handleEditExam = (compId: string) => {
    setSelectedCompetencyId(compId);
    setView("editor");
  };

  const handleBackToGrid = () => {
    setView("grid");
    setSelectedCompetencyId("");
    setActiveExam(null);
  };

  const handleAddQuestion = () => {
    if (!activeExam) return;
    const newQuestion: ExamQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'multiple_choice',
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
      const examId = await ExamService.createOrUpdateExam(activeExam);
      
      // Update local competency exams map
      setCompetencyExams(prev => ({
        ...prev,
        [selectedCompetencyId]: { ...activeExam, id: examId } as Exam
      }));
      
      alert("Exam saved successfully!");
    } catch (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntireExam = async () => {
    if (!activeExam?.id) return;
    
    if (!confirm("Are you sure you want to delete this entire examination? This cannot be undone.")) return;

    setIsSaving(true);
    try {
      await ExamService.deleteExam(activeExam.id);
      
      // Update local state
      setCompetencyExams(prev => {
        const next = { ...prev };
        delete next[selectedCompetencyId];
        return next;
      });
      
      handleBackToGrid();
      alert("Exam deleted successfully.");
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam.");
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Academic Control</p>
          <h1 className="text-5xl font-serif font-bold text-foreground">Examinations</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            {view === "grid" 
              ? "Select a cohort to view and manage competency examinations." 
              : `Editing final examination details for the selected competency.`}
          </p>
        </div>
        {view === "editor" && (
          <Button
            variant="ghost"
            onClick={handleBackToGrid}
            className="rounded-2xl h-12 px-6 border border-[#E8E4D8] hover:bg-primary/5 font-bold"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Overview
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar - Only Cohort Selection now */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-serif">Assessment Link</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Cohort</label>
                <Select value={selectedCohortId} onValueChange={(val) => {
                  setSelectedCohortId(val);
                  setView("grid");
                  setSelectedCompetencyId("");
                }}>
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

              {view === "editor" && (
                <div className="pt-4 border-t border-[#E8E4D8] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Structure</p>
                      <p className="font-bold text-lg">{activeExam?.questions?.length || 0} Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="space-y-0.5">
                      <Label htmlFor="portal-toggle" className="text-xs font-black uppercase tracking-widest text-primary">Portal Status</Label>
                      <p className="text-[10px] text-muted-foreground">{activeExam?.is_portal_open ? "Open for fellows" : "Closed for fellows"}</p>
                    </div>
                    <Switch
                      id="portal-toggle"
                      checked={activeExam?.is_portal_open || false}
                      onCheckedChange={(checked) => setActiveExam(prev => prev ? { ...prev, is_portal_open: checked } : null)}
                    />
                  </div>

                  <Button
                    onClick={handleSaveExam}
                    disabled={isSaving || !activeExam?.questions?.length}
                    className="w-full h-12 rounded-2xl bg-[#1B4332] text-white font-bold"
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Save Changes
                  </Button>

                  {activeExam?.id && (
                    <Button
                      variant="ghost"
                      onClick={handleDeleteEntireExam}
                      disabled={isSaving}
                      className="w-full h-10 rounded-xl text-destructive hover:bg-destructive/10 font-bold text-xs"
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Delete Examination
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {!selectedCohortId ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-12 bg-white/40 backdrop-blur-sm rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
              <BookOpen className="size-16 text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-serif font-bold text-muted-foreground mb-2">Select Cohort</h3>
              <p className="text-muted-foreground max-w-sm">Choose a cohort from the sidebar to view all competency examinations and manage their details.</p>
            </div>
          ) : view === "grid" ? (
            <div className="space-y-6">
              {isLoadingGrid ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
                  <Loader2 className="size-12 text-primary animate-spin" />
                  <p className="text-[#1B4332]/60 font-medium animate-pulse">Mapping cohort competencies...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableCompetencies.map(comp => {
                      const exam = competencyExams[comp.id];
                      const questionCount = exam?.questions?.length || 0;
                      const isPortalOpen = exam?.is_portal_open || false;

                      return (
                        <Card key={comp.id} className="rounded-[2.5rem] border-2 border-[#E8E4D8] hover:border-primary/40 transition-all group">
                          <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                              <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <BookOpen className="size-6" />
                              </div>
                              {isPortalOpen ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Portal Open</Badge>
                              ) : (
                                <Badge variant="outline" className="text-stone-400 border-stone-200">Portal Closed</Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl font-serif">{comp.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{comp.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl mb-6">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <span className="text-sm font-bold">{questionCount} Questions</span>
                              </div>
                              {questionCount > 0 ? (
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600">
                                  <CheckCircle2 className="size-3" />
                                  Ready
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600">
                                  <Clock className="size-3" />
                                  Draft
                                </div>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleEditExam(comp.id)}
                              className="w-full h-12 rounded-2xl bg-white border-2 border-[#E8E4D8] text-primary font-bold hover:bg-primary/5 group/btn"
                            >
                              Insert Examination Detail
                              <ChevronRight className="size-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {availableCompetencies.length === 0 && (
                    <div className="text-center py-20 bg-muted/20 rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
                      <p className="text-muted-foreground italic">No competencies found for this cohort.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : isLoadingExam ? (
            <div className="h-[50vh] flex items-center justify-center">
              <Loader2 className="size-12 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Input
                    value={activeExam?.title || ""}
                    onChange={e => setActiveExam(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-2xl font-serif font-bold h-auto py-2 bg-transparent border-none focus-visible:ring-0 px-0"
                    placeholder="Exam Title"
                  />
                  <p className="text-xs text-muted-foreground">Detailed Content Editor for {availableCompetencies.find(c => c.id === selectedCompetencyId)?.title}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question Type</label>
                          <Select 
                            value={question.type} 
                            onValueChange={(val: 'multiple_choice' | 'written') => handleUpdateQuestion(question.id, { 
                              type: val,
                              options: val === 'multiple_choice' ? ["", "", "", ""] : [],
                              correct_option_index: val === 'multiple_choice' ? 0 : undefined
                            })}
                          >
                            <SelectTrigger className="rounded-xl border-[#E8E4D8]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="written">Written / Open-ended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question Text</label>
                          <Input
                            value={question.text}
                            onChange={e => handleUpdateQuestion(question.id, { text: e.target.value })}
                            placeholder="Enter the question text..."
                            className="rounded-xl border-[#E8E4D8]"
                          />
                        </div>
                      </div>

                      {question.type === 'multiple_choice' ? (
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
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sample Correct Answer / Rubric (Optional)</label>
                          <Textarea 
                            value={question.correct_written_answer || ""}
                            onChange={e => handleUpdateQuestion(question.id, { correct_written_answer: e.target.value })}
                            placeholder="Describe the expected answer for review purposes..."
                            className="rounded-xl border-[#E8E4D8] min-h-[100px]"
                          />
                        </div>
                      )}
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
