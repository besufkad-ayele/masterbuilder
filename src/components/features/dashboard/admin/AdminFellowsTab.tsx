"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Trash2,
  ArrowLeft,
  Building2,
  ChevronRight,
  User as UserIcon,
  Mail,
  ShieldAlert,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { companyService } from "@/services/companyService";
import { cn } from "@/lib/utils";
import FellowCreationForm from "./FellowCreationForm";
import FellowUpdateForm from "./FellowUpdateForm";
import FellowProgressTracker from "./FellowProgressTracker";
import UserProfileDetail from "./UserProfileDetail";
import { FellowService } from "@/services/FellowService";
import { Company, FellowProfile } from "@/types";

function FellowActions({ fellow, onUpdate, onView }: { fellow: any, onUpdate?: () => void, onView: () => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const name = fellow.full_name || fellow.name;
    if (deleteConfirmName === name) {
      setIsDeleting(true);
      try {
        await FellowService.deleteFellow(fellow.id, fellow.user_id);
        setIsDeleteDialogOpen(false);
        setDeleteConfirmName("");
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Error deleting fellow:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
        title="View Fellow Details"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <FellowUpdateForm
        fellow={fellow}
        onFellowUpdated={() => { if (onUpdate) onUpdate(); }}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
            title="Update Profile"
          >
            <UserIcon className="h-4 w-4" />
          </Button>
        }
      />

      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
        onClick={() => setIsDeleteDialogOpen(true)}
        title="Remove Fellow"
      >
        <Trash2 className="h-4 w-4" />
      </Button>


      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-4 border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-destructive">Confirm Deletion</DialogTitle>
            <DialogDescription className="font-serif italic font-medium">
              This will permanently remove the fellow record and their authentication account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 bg-destructive/5 rounded-2xl border-2 border-destructive/10">
              <p className="text-sm text-destructive font-bold flex items-center gap-2">
                <ShieldAlert className="size-4" />
                Action Required
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Type <span className="font-black">&quot;{fellow.full_name}&quot;</span> below to confirm this permanent removal.
              </p>
            </div>
            <Input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Type name here..."
              className="rounded-xl border-2 border-destructive/20 focus:border-destructive transition-all"
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => { setIsDeleteDialogOpen(false); setDeleteConfirmName(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-full shadow-lg shadow-destructive/20"
                onClick={handleDelete}
                disabled={deleteConfirmName !== (fellow.full_name || fellow.name) || isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function AdminFellowsTab() {
  const [fellows, setFellows] = useState<any[]>([]);
  const [, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fellowData, companyData] = await Promise.all([
        FellowService.getAllFellows(),
        companyService.getAll()
      ]);

      setCompanies(companyData);
      setFellows(fellowData.map((f: FellowProfile) => ({
        ...f,
        name: f.full_name,
        companyName: f.organization || (companyData.find(c => c.id === f.company_id)?.name || "Unknown"),
      })));
    } catch (error) {
      console.error("Error fetching fellow data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFellows = useMemo(() => {
    return fellows.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, fellows]);

  const selectedFellow = useMemo(() => {
    return fellows.find(f => f.id === selectedId);
  }, [selectedId, fellows]);

  if (selectedId && selectedFellow) {
    return (
      <div className="space-y-6 px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-full transition-all font-serif font-bold italic"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fellowship Roster
        </Button>

        {/* Two-column: detail + progress tracker */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left: Fellow profile detail */}
          <div className="bg-white rounded-[3.5rem] p-8 shadow-2xl border-4 border-primary/10">
            <UserProfileDetail
              user={{
                ...selectedFellow,
                role: "Fellow",
                company: selectedFellow.companyName,
                location: "Addis Ababa, Ethiopia",
                joinedDate: new Date(selectedFellow.created_at).toLocaleDateString(),
              }}
              isEditable={true}
            />
          </div>

          {/* Right: Progress Tracker Sidebar */}
          <div className="bg-white rounded-[3.5rem] p-6 shadow-2xl border-4 border-primary/10 sticky top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Track Progress</p>
                <p className="text-base font-serif font-bold text-foreground leading-tight">
                  {selectedFellow.full_name || selectedFellow.name}
                </p>
              </div>
            </div>
            <FellowProgressTracker
              fellowId={selectedFellow.id}
              fellowName={selectedFellow.full_name || selectedFellow.name}
              userId={selectedFellow.user_id}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-black mb-2">Member Directory</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Fellowship Workspace</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl font-serif italic text-lg leading-relaxed">
            Manage all fellows enrolled across various companies. Oversee their onboarding progress and handle account lifecycle.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <FellowCreationForm onFellowCreated={fetchData} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border-2 border-[#E8E4D8]/50 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 h-5 w-5" />
          <Input
            placeholder="Search by name, email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-2 border-[#E8E4D8] focus:border-primary transition-all font-serif italic"
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif italic font-medium px-4">
          Showing <span className="text-primary font-black not-italic mx-1">{filteredFellows.length}</span> members in total
        </div>
      </div>

      <Card className="rounded-[3rem] border-2 border-[#E8E4D8] overflow-hidden shadow-2xl bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2 border-[#E8E4D8]/50">
                <TableHead className="font-serif font-black px-10 h-20 text-lg">Fellow Member</TableHead>
                <TableHead className="font-serif font-black h-20 text-lg">Affiliation</TableHead>
                <TableHead className="font-serif font-black h-20 text-center text-lg">Status</TableHead>
                <TableHead className="font-serif font-black h-20 text-right px-10 text-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={4} className="h-24 px-10">
                      <div className="h-12 bg-muted/50 rounded-2xl w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredFellows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-60 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <UserIcon className="size-12 opacity-20" />
                      <p className="font-serif italic text-xl">No members found matching your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFellows.map((fellow) => (
                <TableRow
                  key={fellow.id}
                  className="group hover:bg-primary/5 cursor-pointer transition-all border-b border-[#E8E4D8]/30"
                  onClick={() => setSelectedId(fellow.id)}
                >
                  <TableCell className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <Avatar className="size-16 rounded-[1.5rem] border-2 border-primary/20 group-hover:border-primary group-hover:rotate-3 transition-all">
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                          {(fellow.name as string).split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-serif font-bold text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">
                          {fellow.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="size-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground font-serif italic">{fellow.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                        <Building2 className="size-4 text-primary/60" />
                        {fellow.companyName}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{fellow.department || "No Department"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-widest",
                      fellow.status === "Active" ? "bg-emerald-100 text-emerald-800" :
                        fellow.status === "Onboarding" ? "bg-blue-100 text-blue-800" :
                          fellow.status === "Paused" ? "bg-amber-100 text-amber-800" :
                            "bg-gray-100 text-gray-800"
                    )}>
                      {fellow.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-10" onClick={(e) => e.stopPropagation()}>
                    <FellowActions
                      fellow={fellow}
                      onUpdate={fetchData}
                      onView={() => setSelectedId(fellow.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
