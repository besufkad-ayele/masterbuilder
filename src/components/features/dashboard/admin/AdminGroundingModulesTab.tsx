"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
  Check,
  Globe,
  Building2,
  Briefcase,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import {
  GroundingModule,
  Company
} from "@/types";
import { groundingService } from "@/services/groundingService";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import { CreateGroundingModule } from "../../grounding/CreateGroundingModule";

export default function AdminGroundingModulesTab() {
  const { data, loading: dashboardLoading, refresh } = useAdminDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroundingModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await groundingService.deleteModule(editingItem.id);
      refresh();
      setIsDeleteOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to delete grounding item", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
  };

  const openEdit = (item: GroundingModule) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const modules = data?.groundingModules || [];
  const filteredModules = modules.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (dashboardLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#1B4332]">Grounding Modules</h1>
          <p className="text-muted-foreground text-sm">Design strategic external context and internal organizational grounding templates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Grounding Module
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          className="pl-10 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.map((item) => (
          <Card key={item.id} className="border-border rounded-[2rem] overflow-hidden hover:shadow-xl transition-all group border-2">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black font-serif text-[#1B4332] group-hover:text-primary transition-colors">{item.name}</h3>
                    {item.company_id && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                        {data?.companies.find(c => c.id === item.company_id)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">{item.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => { setEditingItem(item); setIsDeleteOpen(true); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#FDFCF6] p-3 rounded-2xl border border-border/50">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">Part I: External</span>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">{item.structure.part_one.sub_factors.length} Factors</span>
                  </div>
                </div>
                <div className="bg-[#1B4332]/[0.02] p-3 rounded-2xl border border-border/50">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4332] block mb-1">Part II: Internal</span>
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">{item.structure.part_two.video_section.sub_factors.length} Videos</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed">
                <div className="flex -space-x-2">
                  {item.structure.part_one.sub_factors.slice(0, 3).map((f, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-primary/20 flex items-center justify-center text-[8px] font-black">
                      {f.name.charAt(0)}
                    </div>
                  ))}
                  {item.structure.part_one.sub_factors.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-muted text-[8px] font-black flex items-center justify-center">
                      +{item.structure.part_one.sub_factors.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" /> Ready
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-[95vw] w-[1300px] max-h-[95vh] overflow-y-auto rounded-[3rem] p-0 border-0 shadow-2xl bg-white">
          <CreateGroundingModule
            initialData={editingItem as GroundingModule}
            companies={data?.companies || []}
            onSuccess={() => {
              refresh();
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
            }}
            onCancel={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-3xl p-10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif text-destructive">Delete Module</DialogTitle>
            <DialogDescription className="text-lg">
              This will PERMANENTLY delete the grounding module <span className="font-black text-foreground underline italic">"{editingItem?.name}"</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-2xl font-black h-12 px-8 shadow-lg shadow-destructive/20" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
