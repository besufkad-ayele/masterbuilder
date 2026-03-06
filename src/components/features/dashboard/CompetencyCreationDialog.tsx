"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Heart, Brain, Wrench, Video, FileText, HelpCircle, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompetencyDictionary, DictionaryProficiencyLevel, DictionaryBehavior } from "@/types";
import { firebaseService } from "@/services/firebaseService";

interface VideoResource {
  id: string;
  label: string;
  url: string;
}

interface ArticleResource {
  id: string;
  label: string;
  url: string;
}

interface QuizChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  choices: QuizChoice[];
  explanation: string;
}

interface Instruction {
  id: string;
  instruction: string;
}

interface BehavioralIndicatorDraft {
  id: string;
  name: string;
  believe: {
    videos: VideoResource[];
    articles: ArticleResource[];
  };
  know: {
    videos: VideoResource[];
    articles: ArticleResource[];
    quizQuestions: QuizQuestion[];
  };
  do: {
    instructions: Instruction[];
    portfolioDescription: string;
  };
}

interface CompetencyData {
  selectedCompetency: CompetencyDictionary | null;
  selectedProficiency: DictionaryProficiencyLevel | null;
  behavioralIndicators: BehavioralIndicatorDraft[];
}

export default function CompetencyCreationDialog() {
  const [open, setOpen] = useState(false);
  const [competencies, setCompetencies] = useState<CompetencyDictionary[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyDictionary | null>(null);
  const [selectedProficiency, setSelectedProficiency] = useState<DictionaryProficiencyLevel | null>(null);
  const [behavioralIndicators, setBehavioralIndicators] = useState<BehavioralIndicatorDraft[]>([]);
  const [selectedBehavioralIndicator, setSelectedBehavioralIndicator] = useState<DictionaryBehavior | null>(null);
  const [currentBiIndex, setCurrentBiIndex] = useState(0);

  useEffect(() => {
    const fetchCompetencies = async () => {
      // For now, mapping top-level competencies to Directory format
      // In a real scenario, we might fetch the full structure
      const data = await firebaseService.admin.getCompetencies();
      const mapped: CompetencyDictionary[] = data.map(c => ({
        id: c.id,
        code: c.code || "",
        name: c.title,
        definition: c.description,
        importance: "",
        proficiency_levels: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setCompetencies(mapped);
    };
    if (open) fetchCompetencies();
  }, [open]);

  // Form states for current behavioral indicator
  const [currentBI, setCurrentBI] = useState<BehavioralIndicatorDraft>({
    id: "",
    name: "",
    believe: {
      videos: [],
      articles: []
    },
    know: {
      videos: [],
      articles: [],
      quizQuestions: []
    },
    do: {
      instructions: [],
      portfolioDescription: ""
    }
  });

  // Form input states
  const [believeVideoUrl, setBelieveVideoUrl] = useState("");
  const [believeArticleUrl, setBelieveArticleUrl] = useState("");
  const [knowVideoUrl, setKnowVideoUrl] = useState("");
  const [knowArticleUrl, setKnowArticleUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");

  // Enhanced quiz form states
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizChoices, setQuizChoices] = useState<QuizChoice[]>([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
    { id: "3", text: "", isCorrect: false },
    { id: "4", text: "", isCorrect: false }
  ]);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [selectedCorrectChoice, setSelectedCorrectChoice] = useState("");

  const generateBiName = (index: number) => `Behavioral Indicator ${index + 1}`;
  const getBiLabelPrefix = () => selectedBehavioralIndicator?.id || `BI${currentBiIndex + 1}`;

  const getSelectedBiId = (bi: DictionaryBehavior) => {
    if (!selectedCompetency || !selectedProficiency) return bi.id;
    return `${selectedCompetency.id}-${selectedProficiency.level}-${bi.id}`;
  };

  const addBelieveVideo = () => {
    if (!believeVideoUrl.trim()) return;
    const newVideo: VideoResource = {
      id: Date.now().toString(),
      label: `${getBiLabelPrefix()}-BV${currentBI.believe.videos.length + 1}`,
      url: believeVideoUrl
    };
    setCurrentBI({
      ...currentBI,
      believe: {
        ...currentBI.believe,
        videos: [...currentBI.believe.videos, newVideo]
      }
    });
    setBelieveVideoUrl("");
  };

  const addBelieveArticle = () => {
    if (!believeArticleUrl.trim()) return;
    const newArticle: ArticleResource = {
      id: Date.now().toString(),
      label: `${getBiLabelPrefix()}-BA${currentBI.believe.articles.length + 1}`,
      url: believeArticleUrl
    };
    setCurrentBI({
      ...currentBI,
      believe: {
        ...currentBI.believe,
        articles: [...currentBI.believe.articles, newArticle]
      }
    });
    setBelieveArticleUrl("");
  };

  const addKnowVideo = () => {
    if (!knowVideoUrl.trim()) return;
    const newVideo: VideoResource = {
      id: Date.now().toString(),
      label: `${getBiLabelPrefix()}-KV${currentBI.know.videos.length + 1}`,
      url: knowVideoUrl
    };
    setCurrentBI({
      ...currentBI,
      know: {
        ...currentBI.know,
        videos: [...currentBI.know.videos, newVideo]
      }
    });
    setKnowVideoUrl("");
  };

  const addKnowArticle = () => {
    if (!knowArticleUrl.trim()) return;
    const newArticle: ArticleResource = {
      id: Date.now().toString(),
      label: `${getBiLabelPrefix()}-KA${currentBI.know.articles.length + 1}`,
      url: knowArticleUrl
    };
    setCurrentBI({
      ...currentBI,
      know: {
        ...currentBI.know,
        articles: [...currentBI.know.articles, newArticle]
      }
    });
    setKnowArticleUrl("");
  };

  const addQuizQuestion = () => {
    if (!quizQuestion.trim() || !selectedCorrectChoice || !quizExplanation.trim()) return;

    const validChoices = quizChoices.filter(choice => choice.text.trim());
    if (validChoices.length < 2) return;

    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: quizQuestion,
      choices: validChoices.map(choice => ({
        ...choice,
        isCorrect: choice.id === selectedCorrectChoice
      })),
      explanation: quizExplanation
    };

    setCurrentBI({
      ...currentBI,
      know: {
        ...currentBI.know,
        quizQuestions: [...currentBI.know.quizQuestions, newQuestion]
      }
    });

    // Reset quiz form
    setQuizQuestion("");
    setQuizExplanation("");
    setSelectedCorrectChoice("");
    setQuizChoices([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false }
    ]);
  };

  const addInstruction = () => {
    if (!instruction.trim()) return;
    const newInstruction: Instruction = {
      id: Date.now().toString(),
      instruction
    };
    setCurrentBI({
      ...currentBI,
      do: {
        ...currentBI.do,
        instructions: [...currentBI.do.instructions, newInstruction]
      }
    });
    setInstruction("");
  };

  const updateQuizChoice = (choiceId: string, text: string) => {
    setQuizChoices(prev =>
      prev.map(choice =>
        choice.id === choiceId ? { ...choice, text } : choice
      )
    );
  };

  const saveBehavioralIndicator = () => {
    if (!selectedBehavioralIndicator || !selectedCompetency || !selectedProficiency) return;

    const biToSave: BehavioralIndicatorDraft = {
      ...currentBI,
      id: getSelectedBiId(selectedBehavioralIndicator),
      name: `${selectedBehavioralIndicator.id} - ${selectedBehavioralIndicator.description}`,
      do: {
        ...currentBI.do,
        portfolioDescription
      }
    };

    setBehavioralIndicators([...behavioralIndicators, biToSave]);

    // Reset for next BI
    setCurrentBI({
      id: "",
      name: "",
      believe: { videos: [], articles: [] },
      know: { videos: [], articles: [], quizQuestions: [] },
      do: { instructions: [], portfolioDescription: "" }
    });
    setPortfolioDescription("");
    setCurrentBiIndex(currentBiIndex + 1);
    setSelectedBehavioralIndicator(null);
  };

  const removeResource = (category: 'believe' | 'know', type: 'video' | 'article', id: string) => {
    setCurrentBI(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type === 'video' ? 'videos' : 'articles']: prev[category][type === 'video' ? 'videos' : 'articles'].filter(r => r.id !== id)
      }
    }));
  };

  const removeQuizQuestion = (id: string) => {
    setCurrentBI(prev => ({
      ...prev,
      know: {
        ...prev.know,
        quizQuestions: prev.know.quizQuestions.filter(q => q.id !== id)
      }
    }));
  };

  const removeInstruction = (id: string) => {
    setCurrentBI(prev => ({
      ...prev,
      do: {
        ...prev.do,
        instructions: prev.do.instructions.filter(i => i.id !== id)
      }
    }));
  };

  const createCompetency = () => {
    if (!selectedCompetency || !selectedProficiency) return;

    const competencyData: CompetencyData = {
      selectedCompetency,
      selectedProficiency,
      behavioralIndicators
    };

    console.log("Creating competency:", competencyData);

    // Reset form
    setSelectedCompetency(null);
    setSelectedProficiency(null);
    setSelectedBehavioralIndicator(null);
    setBehavioralIndicators([]);
    setCurrentBiIndex(0);
    setCurrentBI({
      id: "",
      name: "",
      believe: { videos: [], articles: [] },
      know: { videos: [], articles: [], quizQuestions: [] },
      do: { instructions: [], portfolioDescription: "" }
    });
    setPortfolioDescription("");
    setBelieveArticleUrl("");
    setKnowArticleUrl("");
    setQuizQuestion("");
    setQuizExplanation("");
    setSelectedCorrectChoice("");
    setQuizChoices([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false }
    ]);
    setOpen(false);
  };

  const isCurrentBiComplete =
    currentBI.believe.videos.length >= 2 && // Reduced requirement for easier testing
    currentBI.believe.articles.length >= 2 &&
    currentBI.know.videos.length >= 2 &&
    currentBI.know.articles.length >= 2 &&
    currentBI.know.quizQuestions.length >= 1 &&
    currentBI.do.instructions.length >= 1 &&
    portfolioDescription.trim().length > 0 &&
    selectedCompetency !== null &&
    selectedProficiency !== null &&
    selectedBehavioralIndicator !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">Create competency</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Competency</DialogTitle>
          <DialogDescription>
            Build a competency with detailed behavioral indicators across Believe, Know, and Do dimensions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Competency Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competency Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Competency</label>
                  <Select value={selectedCompetency?.id || ""} onValueChange={(value) => {
                    const competency = competencies.find(c => c.id === value);
                    setSelectedCompetency(competency || null);
                    setSelectedProficiency(null);
                    setSelectedBehavioralIndicator(null);
                    setBehavioralIndicators([]);
                    setCurrentBiIndex(0);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a competency..." />
                    </SelectTrigger>
                    <SelectContent>
                      {competencies.map((competency) => (
                        <SelectItem key={competency.id} value={competency.id}>
                          {competency.code} - {competency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency Level</label>
                  <Select
                    value={selectedProficiency?.level || ""}
                    onValueChange={(value) => {
                      if (selectedCompetency) {
                        const proficiency = selectedCompetency.proficiency_levels.find(p => p.level === value);
                        setSelectedProficiency(proficiency || null);
                        setSelectedBehavioralIndicator(null);
                        setBehavioralIndicators([]);
                        setCurrentBiIndex(0);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCompetency?.proficiency_levels.map((proficiency) => (
                        <SelectItem key={proficiency.level} value={proficiency.level}>
                          {proficiency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Indicator Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-5" />
                Behavioral Indicators ({behavioralIndicators.length} completed)
              </CardTitle>
              <CardDescription>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">
                    {selectedBehavioralIndicator ? selectedBehavioralIndicator.id : generateBiName(currentBiIndex)}
                  </span>
                  <span className="text-xs text-muted-foreground italic">
                    {selectedBehavioralIndicator?.description || "Define the behavioral indicator details below"}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Behavioral Indicator</label>
                  <Select
                    value={selectedBehavioralIndicator?.id || ""}
                    onValueChange={(value) => {
                      if (!selectedProficiency) return;
                      const selected = selectedProficiency.behavioral_indicators.find(bi => bi.id === value);
                      setSelectedBehavioralIndicator(selected || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select behavioral indicator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProficiency?.behavioral_indicators
                        .filter((bi) => !behavioralIndicators.some((saved) => saved.id === getSelectedBiId(bi)))
                        .map((bi) => (
                          <SelectItem key={bi.id} value={bi.id}>
                            {bi.id} - {bi.description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Believe Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Heart className="text-rose-500" /> Believe Phase</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Video URL" value={believeVideoUrl} onChange={e => setBelieveVideoUrl(e.target.value)} />
                    <Button onClick={addBelieveVideo} size="icon"><Plus /></Button>
                  </div>
                  <div className="space-y-2">
                    {currentBI.believe.videos.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="truncate">{v.url}</span>
                        <Button onClick={() => removeResource('believe', 'video', v.id)} variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Article URL" value={believeArticleUrl} onChange={e => setBelieveArticleUrl(e.target.value)} />
                    <Button onClick={addBelieveArticle} size="icon"><Plus /></Button>
                  </div>
                  <div className="space-y-2">
                    {currentBI.believe.articles.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="truncate">{a.url}</span>
                        <Button onClick={() => removeResource('believe', 'article', a.id)} variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Know Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Brain className="text-blue-500" /> Know Phase</h3>
              {/* Similar UI for Know videos/articles/quiz */}
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                Know Phase detailed editing UI (videos, articles, and quiz) goes here.
              </div>
            </CardContent>
          </Card>

          {/* Do Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Wrench className="text-emerald-500" /> Do Phase</h3>
              <Textarea
                placeholder="Portfolio requirements..."
                value={portfolioDescription}
                onChange={e => setPortfolioDescription(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={saveBehavioralIndicator}
            disabled={!isCurrentBiComplete}
          >
            Save Behavioral Indicator
          </Button>
          <Button
            onClick={createCompetency}
            disabled={behavioralIndicators.length === 0}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90"
          >
            Finish & Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}
