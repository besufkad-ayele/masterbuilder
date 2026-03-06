"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Code, Plus, BookOpen, Save, FileJson, ArrowLeft, Trash2 } from "lucide-react";
import { CompetencyFramework, CompetencyDirectory } from "@/types";
import { firebaseService } from "@/services/firebaseService";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function CompetencyDictionarySidebar() {
  const [framework, setFramework] = useState<CompetencyFramework>({
    frameworkName: "Lead Life Framework",
    overallCompetency: { title: "", description: "" },
    competencies: []
  });
  const [jsonInput, setJsonInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "json">("edit");
  const [editingCompetency, setEditingCompetency] = useState<CompetencyDirectory | null>(null);

  useEffect(() => {
    const fetchCompetencies = async () => {
      const competenciesData = await firebaseService.admin.getCompetencies();
      const mappedCompetencies: CompetencyDirectory[] = competenciesData.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.title,
        definition: c.description,
        importance: "",
        proficiencyLevels: []
      }));
      const newFramework: CompetencyFramework = {
        frameworkName: "Lead Life Framework",
        overallCompetency: { title: "Executive Mastery", description: "Bridging academic theory and executive mastery." },
        competencies: mappedCompetencies
      };
      setFramework(newFramework);
      setJsonInput(JSON.stringify(newFramework, null, 2));
    };
    if (isOpen) fetchCompetencies();
  }, [isOpen]);

  const handleUpdateFramework = (field: string, value: string) => {
    const updated = { ...framework, [field]: value };
    setFramework(updated);
    setJsonInput(JSON.stringify(updated, null, 2));
  };

  const handleUpdateOverall = (field: string, value: string) => {
    const updated = {
      ...framework,
      overallCompetency: {
        ...framework.overallCompetency,
        [field]: value
      }
    };
    setFramework(updated);
    setJsonInput(JSON.stringify(updated, null, 2));
  };

  const handleAddCompetency = () => {
    const newComp: CompetencyDirectory = {
      id: `c${framework.competencies.length + 1}`,
      code: `C${framework.competencies.length + 1}`,
      name: "New Competency",
      definition: "",
      importance: "",
      proficiencyLevels: [
        {
          level: "basic",
          name: "Basic",
          description: "",
          behavioralIndicators: []
        },
        {
          level: "intermediate",
          name: "Intermediate",
          description: "",
          behavioralIndicators: []
        },
        {
          level: "advanced",
          name: "Advanced",
          description: "",
          behavioralIndicators: []
        },
        {
          level: "expert",
          name: "Expert",
          description: "",
          behavioralIndicators: []
        }
      ]
    };
    setEditingCompetency(newComp);
  };

  const handleSaveCompetency = () => {
    if (!editingCompetency) return;

    const exists = framework.competencies.find(c => c.id === editingCompetency.id);
    let updatedCompetencies;

    if (exists) {
      updatedCompetencies = framework.competencies.map(c =>
        c.id === editingCompetency.id ? editingCompetency : c
      );
    } else {
      updatedCompetencies = [...framework.competencies, editingCompetency];
    }

    const updatedFramework = { ...framework, competencies: updatedCompetencies };
    setFramework(updatedFramework);
    setJsonInput(JSON.stringify(updatedFramework, null, 2));
    setEditingCompetency(null);
  };

  const handleRemoveCompetency = (id: string) => {
    const updatedCompetencies = framework.competencies.filter(c => c.id !== id);
    const updatedFramework = { ...framework, competencies: updatedCompetencies };
    setFramework(updatedFramework);
    setJsonInput(JSON.stringify(updatedFramework, null, 2));
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setFramework(parsed);
      // In a real app, we would save this to a database or local storage
      console.log("Saving framework:", parsed);
      setIsOpen(false);
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setEditingCompetency(null);
    }}>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full gap-2">
          <BookOpen className="w-4 h-4" />
          Dictionary Manager
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full flex flex-col h-full">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {editingCompetency && (
              <Button variant="ghost" size="icon" onClick={() => setEditingCompetency(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="text-2xl font-display">
              {editingCompetency ? "Edit Competency" : "Competency Dictionary"}
            </SheetTitle>
          </div>
          <SheetDescription>
            {editingCompetency
              ? `Defining ${editingCompetency.name || "new competency"}`
              : "Configure the global competency framework and behavioral standards."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 mt-6 flex flex-col overflow-hidden">
          {!editingCompetency && (
            <div className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg mb-4">
              <button
                onClick={() => setActiveTab("edit")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Plus className="w-4 h-4" /> Edit Framework
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === "json" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileJson className="w-4 h-4" /> JSON Logic
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {editingCompetency ? (
              <div className="h-full overflow-y-auto pr-2 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input
                        value={editingCompetency.code}
                        onChange={e => setEditingCompetency({ ...editingCompetency, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editingCompetency.name}
                        onChange={e => setEditingCompetency({ ...editingCompetency, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Definition</Label>
                    <Textarea
                      value={editingCompetency.definition}
                      onChange={e => setEditingCompetency({ ...editingCompetency, definition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Importance</Label>
                    <Textarea
                      value={editingCompetency.importance}
                      onChange={e => setEditingCompetency({ ...editingCompetency, importance: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-widest">Proficiency Levels & BIs</h4>
                    {editingCompetency.proficiencyLevels.map((lvl, idx) => (
                      <div key={lvl.level} className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="capitalize font-bold text-accent">{lvl.level}</Label>
                        </div>
                        <Textarea
                          className="text-xs mb-3"
                          placeholder="Level description..."
                          value={lvl.description}
                          onChange={e => {
                            const newLevels = [...editingCompetency.proficiencyLevels];
                            newLevels[idx].description = e.target.value;
                            setEditingCompetency({ ...editingCompetency, proficiencyLevels: newLevels });
                          }}
                        />
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase">Behavioral Indicators ({lvl.behavioralIndicators.length})</Label>
                          {lvl.behavioralIndicators.map((bi, biIdx) => (
                            <div key={bi.id} className="flex gap-2">
                              <Input
                                className="text-xs"
                                value={bi.description}
                                onChange={e => {
                                  const newLevels = [...editingCompetency.proficiencyLevels];
                                  newLevels[idx].behavioralIndicators[biIdx].description = e.target.value;
                                  setEditingCompetency({ ...editingCompetency, proficiencyLevels: newLevels });
                                }}
                              />
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] h-7 border border-dashed"
                            onClick={() => {
                              const newLevels = [...editingCompetency.proficiencyLevels];
                              newLevels[idx].behavioralIndicators.push({
                                id: `BI${lvl.behavioralIndicators.length + 1}`,
                                description: ""
                              });
                              setEditingCompetency({ ...editingCompetency, proficiencyLevels: newLevels });
                            }}
                          >
                            + Add BI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleSaveCompetency}>Apply Changes</Button>
                </div>
              </div>
            ) : activeTab === "edit" ? (
              <div className="h-full overflow-y-auto pr-2 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="frameworkName">Framework Name</Label>
                    <Input
                      id="frameworkName"
                      value={framework.frameworkName}
                      onChange={(e) => handleUpdateFramework("frameworkName", e.target.value)}
                      placeholder="e.g. MIDROC Mining Cluster"
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overall Competency</h3>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={framework.overallCompetency.title}
                        onChange={(e) => handleUpdateOverall("title", e.target.value)}
                        placeholder="Framework Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        className="min-h-[100px]"
                        value={framework.overallCompetency.description}
                        onChange={(e) => handleUpdateOverall("description", e.target.value)}
                        placeholder="Describe the framework's purpose"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Competencies ({framework.competencies.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {framework.competencies.map((comp) => (
                        <div key={comp.id} className="p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{comp.name}</p>
                            <p className="text-xs text-muted-foreground">{comp.code} • {comp.proficiencyLevels.length} Levels</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingCompetency(comp)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCompetency(comp.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-dashed gap-2" onClick={handleAddCompetency}>
                        <Plus className="w-4 h-4" /> Add Competency
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <Label className="mb-2">Raw Framework Data (JSON)</Label>
                <Textarea
                  className="flex-1 font-mono text-xs p-4 bg-slate-950 text-slate-50 resize-none rounded-lg focus:ring-1 focus:ring-accent"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Tip: You can paste a complete JSON framework here to bulk-update the library.
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          {!editingCompetency && (
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save Dictionary
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

