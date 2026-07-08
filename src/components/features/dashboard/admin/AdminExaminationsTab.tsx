"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  FileText,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  ClipboardList,
} from "lucide-react";
import {
  ExamService,
  ExamQuestion,
  CompetencyQuestionBank,
  Examination,
} from "@/services/ExamService";
import { CohortService } from "@/services/CohortService";
import { FellowProgressService } from "@/services/FellowProgressService";
import { Competency } from "@/types";
import { cn } from "@/lib/utils";

type CompetencyMeta = {
  waveNumber: number;
  waveName: string;
  waveLevel: string;
  displayOrder: number;
};

const generateExamAccessCode = () =>
  `EX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const emptyQuestion = (): ExamQuestion => ({
  id: Math.random().toString(36).slice(2, 11),
  type: "multiple_choice",
  text: "",
  options: ["", "", "", ""],
  correct_option_index: 0,
});

export default function AdminExaminationsTab() {
  const { data: dashboardData, loading: dashboardLoading } = useAdminDashboard();

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [topTab, setTopTab] = useState<"banks" | "exams">("banks");

  const [availableCompetencies, setAvailableCompetencies] = useState<Competency[]>([]);
  const [competencyMetaById, setCompetencyMetaById] = useState<Record<string, CompetencyMeta>>({});
  const [questionBanks, setQuestionBanks] = useState<Record<string, CompetencyQuestionBank>>({});
  const [examinations, setExaminations] = useState<Examination[]>([]);

  const [isLoadingGrid, setIsLoadingGrid] = useState(false);

  // Question-bank editor
  const [bankView, setBankView] = useState<"grid" | "editor">("grid");
  const [editingCompetencyId, setEditingCompetencyId] = useState<string>("");
  const [draftQuestions, setDraftQuestions] = useState<ExamQuestion[]>([]);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Examination editor
  const [examView, setExamView] = useState<"list" | "editor">("list");
  const [activeExamination, setActiveExamination] = useState<Partial<Examination> | null>(null);
  const [isSavingExam, setIsSavingExam] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const selectedCohortName =
    dashboardData?.cohorts.find((cohort) => cohort.id === selectedCohortId)?.name || "";
  const selectedCohortLevel =
    dashboardData?.cohorts.find((cohort) => cohort.id === selectedCohortId)?.wave_level || "";

  const cohortFellows = useMemo(
    () => (dashboardData?.fellows || []).filter((f: any) => f.cohort_id === selectedCohortId),
    [dashboardData, selectedCohortId]
  );

  const pushNotice = (type: "success" | "error" | "warning", message: string) => {
    setNotice({ type, message });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  // Fetch competencies, question banks and examinations for the selected cohort
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!selectedCohortId) {
        setAvailableCompetencies([]);
        setCompetencyMetaById({});
        setQuestionBanks({});
        setExaminations([]);
        setBankView("grid");
        setExamView("list");
        return;
      }

      setIsLoadingGrid(true);
      try {
        const waves = (await CohortService.getWavesByCohort(selectedCohortId)).sort(
          (a, b) => a.number - b.number
        );

        const allWaveCompsResults = await Promise.all(
          waves.map(async (wave) => ({
            wave,
            comps: await CohortService.getWaveCompetencies(wave.id),
          }))
        );

        const compIds = Array.from(
          new Set(allWaveCompsResults.flatMap(({ comps }) => comps.map((wc) => wc.competency_id)))
        );

        const allComps = await FellowProgressService.getAllCompetencies();
        const cohortComps = allComps.filter((c) => compIds.includes(c.id));

        const metaById: Record<string, CompetencyMeta> = {};
        allWaveCompsResults.forEach(({ wave, comps }) => {
          comps.forEach((wc) => {
            const candidate: CompetencyMeta = {
              waveNumber: wave.number,
              waveName: wave.name || `Wave ${wave.number}`,
              waveLevel: selectedCohortLevel || "N/A",
              displayOrder: wc.display_order ?? Number.MAX_SAFE_INTEGER,
            };
            const current = metaById[wc.competency_id];
            if (
              !current ||
              candidate.waveNumber < current.waveNumber ||
              (candidate.waveNumber === current.waveNumber &&
                candidate.displayOrder < current.displayOrder)
            ) {
              metaById[wc.competency_id] = candidate;
            }
          });
        });

        const sortedCompetencies = [...cohortComps].sort((a, b) => {
          const metaA = metaById[a.id];
          const metaB = metaById[b.id];
          if (metaA && metaB) {
            if (metaA.waveNumber !== metaB.waveNumber) return metaA.waveNumber - metaB.waveNumber;
            if (metaA.displayOrder !== metaB.displayOrder) return metaA.displayOrder - metaB.displayOrder;
          }
          return a.title.localeCompare(b.title);
        });

        setCompetencyMetaById(metaById);
        setAvailableCompetencies(sortedCompetencies);

        const [banks, exams] = await Promise.all([
          ExamService.getQuestionBanksByCohort(selectedCohortId),
          ExamService.getExaminationsByCohort(selectedCohortId),
        ]);
        const bankMap: Record<string, CompetencyQuestionBank> = {};
        banks.forEach((b) => {
          bankMap[b.competency_id] = b;
        });
        setQuestionBanks(bankMap);
        setExaminations(exams);
      } catch (error) {
        console.error("Error fetching cohort data:", error);
        pushNotice("error", "Failed to load cohort data.");
      } finally {
        setIsLoadingGrid(false);
      }
    };

    fetchCohortData();
  }, [selectedCohortId, selectedCohortLevel]);

  /* ─── Question bank handlers ────────────────────────────────────────────── */

  const handleEditBank = (competencyId: string) => {
    setEditingCompetencyId(competencyId);
    setDraftQuestions(questionBanks[competencyId]?.questions?.map((q) => ({ ...q })) || []);
    setBankView("editor");
  };

  const handleBackToBankGrid = () => {
    setBankView("grid");
    setEditingCompetencyId("");
    setDraftQuestions([]);
  };

  const handleAddQuestion = () => setDraftQuestions((prev) => [...prev, emptyQuestion()]);

  const handleRemoveQuestion = (id: string) =>
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));

  const handleUpdateQuestion = (id: string, updates: Partial<ExamQuestion>) =>
    setDraftQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));

  const handleSaveBank = async () => {
    if (!selectedCohortId || !editingCompetencyId) return;

    const invalid = draftQuestions.find((q) => !q.text.trim());
    if (invalid) {
      pushNotice("warning", "Every question needs a prompt.");
      return;
    }

    setIsSavingBank(true);
    try {
      await ExamService.saveQuestionBank(selectedCohortId, editingCompetencyId, draftQuestions);
      const now = new Date().toISOString();
      setQuestionBanks((prev) => ({
        ...prev,
        [editingCompetencyId]: {
          id: `${selectedCohortId}__${editingCompetencyId}`,
          cohort_id: selectedCohortId,
          competency_id: editingCompetencyId,
          questions: draftQuestions,
          created_at: prev[editingCompetencyId]?.created_at || now,
          updated_at: now,
        },
      }));
      pushNotice("success", "Question bank saved.");
    } catch (error) {
      console.error("Error saving question bank:", error);
      pushNotice("error", "Failed to save question bank.");
    } finally {
      setIsSavingBank(false);
    }
  };

  /* ─── Examination handlers ──────────────────────────────────────────────── */

  const handleNewExamination = () => {
    setActiveExamination({
      cohort_id: selectedCohortId,
      title: "New Examination",
      competency_ids: [],
      fellow_ids: [],
      access_code: generateExamAccessCode(),
      time_allocated_minutes: 60,
      is_enabled: false,
      is_portal_open: false,
      allow_retake: false,
    });
    setExamView("editor");
  };

  const handleEditExamination = (exam: Examination) => {
    setActiveExamination({ ...exam });
    setExamView("editor");
  };

  const handleBackToExamList = () => {
    setExamView("list");
    setActiveExamination(null);
  };

  const toggleExamCompetency = (competencyId: string) => {
    setActiveExamination((prev) => {
      if (!prev) return prev;
      const ids = prev.competency_ids || [];
      return {
        ...prev,
        competency_ids: ids.includes(competencyId)
          ? ids.filter((id) => id !== competencyId)
          : [...ids, competencyId],
      };
    });
  };

  const toggleExamFellow = (userId: string) => {
    setActiveExamination((prev) => {
      if (!prev) return prev;
      const ids = prev.fellow_ids || [];
      return {
        ...prev,
        fellow_ids: ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId],
      };
    });
  };

  const handleSaveExamination = async () => {
    if (!activeExamination || !selectedCohortId) return;
    if (!activeExamination.title?.trim()) {
      pushNotice("warning", "Give the examination a title.");
      return;
    }
    if (!(activeExamination.competency_ids || []).length) {
      pushNotice("warning", "Select at least one competency to examine.");
      return;
    }
    if (!(activeExamination.fellow_ids || []).length) {
      pushNotice("warning", "Select at least one fellow to sit this examination.");
      return;
    }

    setIsSavingExam(true);
    try {
      const payload: Partial<Examination> = {
        ...activeExamination,
        cohort_id: selectedCohortId,
        access_code: activeExamination.access_code || generateExamAccessCode(),
        time_allocated_minutes: Math.max(1, Math.round(Number(activeExamination.time_allocated_minutes) || 60)),
      };
      const id = await ExamService.createOrUpdateExamination(payload);
      const saved = { ...payload, id } as Examination;
      setExaminations((prev) => {
        const others = prev.filter((e) => e.id !== id);
        return [...others, saved];
      });
      setActiveExamination(saved);
      pushNotice("success", "Examination saved.");
    } catch (error) {
      console.error("Error saving examination:", error);
      pushNotice("error", "Failed to save examination.");
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleDeleteExamination = async () => {
    if (!activeExamination?.id) return;
    if (!confirm("Delete this examination? This cannot be undone.")) return;
    setIsSavingExam(true);
    try {
      await ExamService.deleteExamination(activeExamination.id);
      setExaminations((prev) => prev.filter((e) => e.id !== activeExamination.id));
      handleBackToExamList();
      pushNotice("success", "Examination deleted.");
    } catch (error) {
      console.error("Error deleting examination:", error);
      pushNotice("error", "Failed to delete examination.");
    } finally {
      setIsSavingExam(false);
    }
  };

  const competencyTitle = (id: string) =>
    availableCompetencies.find((c) => c.id === id)?.title || "Competency";

  if (dashboardLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {notice && (
        <div className="fixed top-6 right-6 z-[220]">
          <Card
            className={cn(
              "rounded-xl border shadow-xl min-w-[280px]",
              notice.type === "success" && "border-emerald-200 bg-emerald-50",
              notice.type === "error" && "border-red-200 bg-red-50",
              notice.type === "warning" && "border-amber-200 bg-amber-50"
            )}
          >
            <CardContent className="py-3 px-4 text-sm font-medium text-[#1B4332]">
              {notice.message}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-2">Academic Control</p>
          <h1 className="text-5xl font-serif font-bold text-foreground">Examinations</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Build competency question banks, then assemble examinations for selected fellows.
          </p>
        </div>
      </div>

      {/* Cohort selector + top tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Target Cohort
          </label>
          <Select
            value={selectedCohortId}
            onValueChange={(val) => {
              setSelectedCohortId(val);
              setBankView("grid");
              setExamView("list");
              setActiveExamination(null);
            }}
          >
            <SelectTrigger className="rounded-xl w-[260px]">
              <span className={cn(!selectedCohortName && "text-muted-foreground")}>
                {selectedCohortName || "Select Cohort"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {dashboardData?.cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCohortId && (
          <div className="flex items-center gap-2">
            <Button
              variant={topTab === "banks" ? "default" : "outline"}
              onClick={() => setTopTab("banks")}
              className="rounded-xl h-10"
            >
              <ClipboardList className="size-4 mr-2" />
              Question Banks
            </Button>
            <Button
              variant={topTab === "exams" ? "default" : "outline"}
              onClick={() => setTopTab("exams")}
              className="rounded-xl h-10"
            >
              <FileText className="size-4 mr-2" />
              Examinations
            </Button>
          </div>
        )}
      </div>

      {!selectedCohortId ? (
        <div className="h-[50vh] flex flex-col items-center justify-center text-center p-12 bg-white/40 backdrop-blur-sm rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
          <BookOpen className="size-16 text-muted-foreground/20 mb-6" />
          <h3 className="text-2xl font-serif font-bold text-muted-foreground mb-2">Select Cohort</h3>
          <p className="text-muted-foreground max-w-sm">
            Choose a cohort to manage competency question banks and examinations.
          </p>
        </div>
      ) : isLoadingGrid ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-12 text-primary animate-spin" />
          <p className="text-[#1B4332]/60 font-medium animate-pulse">Mapping cohort competencies...</p>
        </div>
      ) : topTab === "banks" ? (
        bankView === "grid" ? (
          <BankGrid
            competencies={availableCompetencies}
            metaById={competencyMetaById}
            banks={questionBanks}
            cohortLevel={selectedCohortLevel}
            onEdit={handleEditBank}
          />
        ) : (
          <QuestionBankEditor
            competencyTitle={competencyTitle(editingCompetencyId)}
            questions={draftQuestions}
            isSaving={isSavingBank}
            onBack={handleBackToBankGrid}
            onAdd={handleAddQuestion}
            onRemove={handleRemoveQuestion}
            onUpdate={handleUpdateQuestion}
            onSave={handleSaveBank}
          />
        )
      ) : examView === "list" ? (
        <ExaminationList
          examinations={examinations}
          competencyTitle={competencyTitle}
          onNew={handleNewExamination}
          onEdit={handleEditExamination}
        />
      ) : (
        <ExaminationEditor
          examination={activeExamination!}
          competencies={availableCompetencies}
          banks={questionBanks}
          fellows={cohortFellows}
          isSaving={isSavingExam}
          onBack={handleBackToExamList}
          onChange={setActiveExamination}
          onToggleCompetency={toggleExamCompetency}
          onToggleFellow={toggleExamFellow}
          onRegenerateCode={() =>
            setActiveExamination((prev) => (prev ? { ...prev, access_code: generateExamAccessCode() } : prev))
          }
          onSave={handleSaveExamination}
          onDelete={handleDeleteExamination}
        />
      )}
    </div>
  );
}

/* ─── Question bank grid ──────────────────────────────────────────────────── */

function BankGrid({
  competencies,
  metaById,
  banks,
  cohortLevel,
  onEdit,
}: {
  competencies: Competency[];
  metaById: Record<string, CompetencyMeta>;
  banks: Record<string, CompetencyQuestionBank>;
  cohortLevel: string;
  onEdit: (competencyId: string) => void;
}) {
  if (competencies.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
        <p className="text-muted-foreground italic">No competencies found for this cohort.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {competencies.map((comp) => {
        const bank = banks[comp.id];
        const questionCount = bank?.questions?.length || 0;
        const meta = metaById[comp.id];
        return (
          <Card
            key={comp.id}
            className="rounded-[2.5rem] border-2 border-[#E8E4D8] hover:border-primary/40 transition-all group"
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <BookOpen className="size-6" />
                </div>
                {questionCount > 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {questionCount} Questions
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-stone-400 border-stone-200">
                    Empty
                  </Badge>
                )}
              </div>
              {comp.code && (
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">{comp.code}</p>
              )}
              <CardTitle className="text-xl font-serif">{comp.title}</CardTitle>
              <CardDescription className="line-clamp-2">{comp.description}</CardDescription>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2">
                Wave {meta?.waveNumber ?? "?"} • {meta?.waveLevel || cohortLevel || "N/A"}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onEdit(comp.id)}
                className="w-full h-12 rounded-2xl bg-white border-2 border-[#E8E4D8] text-primary font-bold hover:bg-primary/5 group/btn"
              >
                {questionCount > 0 ? "Edit Question Bank" : "Insert Questions"}
                <ChevronRight className="size-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Question bank editor ────────────────────────────────────────────────── */

function QuestionBankEditor({
  competencyTitle,
  questions,
  isSaving,
  onBack,
  onAdd,
  onRemove,
  onUpdate,
  onSave,
}: {
  competencyTitle: string;
  questions: ExamQuestion[];
  isSaving: boolean;
  onBack: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExamQuestion>) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="rounded-2xl h-10 px-4 border border-[#E8E4D8] hover:bg-primary/5 font-bold mb-3"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Competencies
          </Button>
          <h2 className="text-2xl font-serif font-bold text-[#1B4332]">{competencyTitle}</h2>
          <p className="text-xs text-muted-foreground">Question bank for this competency ({questions.length} questions)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onAdd}
            className="rounded-2xl h-12 px-6 border-[#E8E4D8] text-primary font-bold hover:bg-primary/5"
          >
            <Plus className="size-4 mr-2" />
            Add Question
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-2xl h-12 px-6 bg-[#1B4332] text-white font-bold"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Save Bank
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
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
                onClick={() => onRemove(question.id)}
                className="text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Question Type
                  </label>
                  <Select
                    value={question.type}
                    onValueChange={(val) =>
                      onUpdate(question.id, {
                        type: val as "multiple_choice" | "written",
                        options: val === "multiple_choice" ? ["", "", "", ""] : [],
                        correct_option_index: val === "multiple_choice" ? 0 : undefined,
                      })
                    }
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Question Text
                  </label>
                  <Input
                    value={question.text}
                    onChange={(e) => onUpdate(question.id, { text: e.target.value })}
                    placeholder="Enter the question text..."
                    className="rounded-xl border-[#E8E4D8]"
                  />
                </div>
              </div>

              {question.type === "multiple_choice" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Option {String.fromCharCode(65 + optIndex)}
                        </label>
                        <button
                          onClick={() => onUpdate(question.id, { correct_option_index: optIndex })}
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
                        onChange={(e) => {
                          const newOptions = [...question.options];
                          newOptions[optIndex] = e.target.value;
                          onUpdate(question.id, { options: newOptions });
                        }}
                        placeholder={`Option ${optIndex + 1}`}
                        className={cn(
                          "rounded-xl border-[#E8E4D8]",
                          question.correct_option_index === optIndex &&
                            "border-emerald-500 ring-2 ring-emerald-500/10"
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Sample Correct Answer / Rubric (Optional)
                  </label>
                  <Textarea
                    value={question.correct_written_answer || ""}
                    onChange={(e) => onUpdate(question.id, { correct_written_answer: e.target.value })}
                    placeholder="Describe the expected answer for review purposes..."
                    className="rounded-xl border-[#E8E4D8] min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic">
            No questions yet. Click &quot;Add Question&quot; to start building this competency&apos;s bank.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Examination list ────────────────────────────────────────────────────── */

function ExaminationList({
  examinations,
  competencyTitle,
  onNew,
  onEdit,
}: {
  examinations: Examination[];
  competencyTitle: (id: string) => string;
  onNew: () => void;
  onEdit: (exam: Examination) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-[#1B4332]">Examinations</h2>
        <Button onClick={onNew} className="rounded-2xl h-12 px-6 bg-[#1B4332] text-white font-bold">
          <Plus className="size-4 mr-2" />
          Create Examination
        </Button>
      </div>

      {examinations.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[3.5rem] border-2 border-dashed border-[#E8E4D8]">
          <p className="text-muted-foreground italic">No examinations created for this cohort yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examinations.map((exam) => (
            <Card key={exam.id} className="rounded-[2.5rem] border-2 border-[#E8E4D8] hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <FileText className="size-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={exam.is_enabled ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                      {exam.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {exam.is_portal_open ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Portal Open</Badge>
                    ) : (
                      <Badge variant="outline" className="text-stone-400 border-stone-200">Portal Closed</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-serif">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {(exam.competency_ids || []).map(competencyTitle).join(", ") || "No competencies"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-muted/30 rounded-2xl">
                    <p className="text-lg font-black text-[#1B4332]">{(exam.competency_ids || []).length}</p>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Competencies</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-2xl">
                    <p className="text-lg font-black text-[#1B4332]">{(exam.fellow_ids || []).length}</p>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Fellows</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-2xl">
                    <p className="text-lg font-black text-[#1B4332]">{exam.time_allocated_minutes}m</p>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Duration</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono bg-muted/40 px-2 py-1 rounded-lg">{exam.access_code}</span>
                  <span className={cn("font-bold", exam.allow_retake ? "text-amber-600" : "text-stone-400")}>
                    {exam.allow_retake ? "Retake allowed" : "Single attempt"}
                  </span>
                </div>
                <Button
                  onClick={() => onEdit(exam)}
                  className="w-full h-11 rounded-2xl bg-white border-2 border-[#E8E4D8] text-primary font-bold hover:bg-primary/5"
                >
                  Manage Examination
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Examination editor ──────────────────────────────────────────────────── */

function ExaminationEditor({
  examination,
  competencies,
  banks,
  fellows,
  isSaving,
  onBack,
  onChange,
  onToggleCompetency,
  onToggleFellow,
  onRegenerateCode,
  onSave,
  onDelete,
}: {
  examination: Partial<Examination>;
  competencies: Competency[];
  banks: Record<string, CompetencyQuestionBank>;
  fellows: any[];
  isSaving: boolean;
  onBack: () => void;
  onChange: (updater: (prev: Partial<Examination> | null) => Partial<Examination> | null) => void;
  onToggleCompetency: (id: string) => void;
  onToggleFellow: (id: string) => void;
  onRegenerateCode: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const set = (updates: Partial<Examination>) => onChange((prev) => (prev ? { ...prev, ...updates } : prev));
  const selectedComps = examination.competency_ids || [];
  const selectedFellows = examination.fellow_ids || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-2xl h-10 px-4 border border-[#E8E4D8] hover:bg-primary/5 font-bold"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Examinations
        </Button>
        <div className="flex items-center gap-2">
          {examination.id && (
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={isSaving}
              className="rounded-xl h-11 text-destructive hover:bg-destructive/10 font-bold"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-2xl h-11 px-6 bg-[#1B4332] text-white font-bold"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Save Examination
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8] lg:col-span-1 h-fit">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg font-serif">Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input
                value={examination.title || ""}
                onChange={(e) => set({ title: e.target.value })}
                className="rounded-xl"
                placeholder="Examination title"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Secure Access Code
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={examination.access_code || ""}
                  onChange={(e) => set({ access_code: e.target.value.toUpperCase() })}
                  className="rounded-xl font-mono"
                />
                <Button type="button" variant="outline" className="rounded-xl" onClick={onRegenerateCode}>
                  New
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Time Allocated (Minutes)
              </Label>
              <Input
                type="number"
                min={1}
                value={examination.time_allocated_minutes || ""}
                onChange={(e) => set({ time_allocated_minutes: e.target.value ? Number(e.target.value) : 0 })}
                className="rounded-xl"
                placeholder="e.g. 60"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase tracking-widest text-blue-700">Enabled</Label>
                <p className="text-[10px] text-muted-foreground">Visible to targeted fellows</p>
              </div>
              <Switch
                checked={examination.is_enabled || false}
                onCheckedChange={(checked) => set({ is_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase tracking-widest text-primary">Portal Open</Label>
                <p className="text-[10px] text-muted-foreground">Fellows may start the exam</p>
              </div>
              <Switch
                checked={examination.is_portal_open || false}
                onCheckedChange={(checked) => set({ is_portal_open: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50/70 rounded-2xl border border-amber-100">
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase tracking-widest text-amber-700">Allow Retake</Label>
                <p className="text-[10px] text-muted-foreground">Selected fellows can re-sit</p>
              </div>
              <Switch
                checked={examination.allow_retake || false}
                onCheckedChange={(checked) => set({ allow_retake: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Competencies + fellows */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8]">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-serif">Competencies to Examine</CardTitle>
              <Badge variant="outline" className="rounded-full">{selectedComps.length} selected</Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-2 max-h-[320px] overflow-y-auto">
              {competencies.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No competencies in this cohort.</p>
              )}
              {competencies.map((comp) => {
                const count = banks[comp.id]?.questions?.length || 0;
                const checked = selectedComps.includes(comp.id);
                return (
                  <button
                    key={comp.id}
                    onClick={() => onToggleCompetency(comp.id)}
                    className={cn(
                      "w-full text-left flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                      checked ? "border-primary bg-primary/5" : "border-[#E8E4D8] hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-5 rounded-md border-2 flex items-center justify-center shrink-0",
                          checked ? "bg-primary border-primary text-white" : "border-[#E8E4D8]"
                        )}
                      >
                        {checked && <CheckCircle2 className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{comp.title}</p>
                        <p className="text-[10px] text-muted-foreground">{comp.code}</p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        count > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                      )}
                    >
                      {count > 0 ? `${count} Q` : "Empty"}
                    </Badge>
                  </button>
                );
              })}
              {selectedComps.some((id) => (banks[id]?.questions?.length || 0) === 0) && (
                <p className="text-xs text-red-600 font-medium pt-2 flex items-center gap-1">
                  <Clock className="size-3" /> Some selected competencies have no questions yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-2 border-[#E8E4D8]">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Users className="size-5" /> Fellows to Examine
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8"
                  onClick={() =>
                    onChange((prev) =>
                      prev ? { ...prev, fellow_ids: fellows.map((f) => f.user_id) } : prev
                    )
                  }
                >
                  Select all
                </Button>
                <Badge variant="outline" className="rounded-full">{selectedFellows.length} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
              {fellows.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No fellows assigned to this cohort.</p>
              )}
              {fellows.map((fellow) => {
                const checked = selectedFellows.includes(fellow.user_id);
                return (
                  <button
                    key={fellow.id}
                    onClick={() => onToggleFellow(fellow.user_id)}
                    className={cn(
                      "text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition-all",
                      checked ? "border-primary bg-primary/5" : "border-[#E8E4D8] hover:border-primary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "size-5 rounded-md border-2 flex items-center justify-center shrink-0",
                        checked ? "bg-primary border-primary text-white" : "border-[#E8E4D8]"
                      )}
                    >
                      {checked && <CheckCircle2 className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{fellow.full_name || "Unnamed Fellow"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{fellow.email}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
