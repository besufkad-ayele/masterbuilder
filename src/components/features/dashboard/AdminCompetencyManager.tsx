"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Book, Library, Loader2 } from "lucide-react";
import { competencyService } from "@/services/competencyService";
import { firebaseService } from "@/services/firebaseService";
import { CompetencyDictionary, CompetencyLibrary, Company } from "@/types";
import AdminCompetencyDictionaryTab from "./admin/competencies/AdminCompetencyDictionaryTab";
import AdminCompetencyLibraryTab from "./admin/competencies/AdminCompetencyLibraryTab";
// import AdminCompetencyLibraryTab from "./admin/competencies/AdminCompetencyLibraryTab";

export default function AdminCompetencyManager() {
    const [activeTab, setActiveTab] = useState("dictionary");
    const [dictionary, setDictionary] = useState<CompetencyDictionary[]>([]);
    const [library, setLibrary] = useState<CompetencyLibrary[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dictData, libData, companyData] = await Promise.all([
                competencyService.getDictionary(),
                competencyService.getLibrary(),
                firebaseService.admin.getCompanies()
            ]);
            setDictionary(dictData);
            setLibrary(libData);
            setCompanies(companyData);
        } catch (error) {
            console.error("Failed to fetch competency data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Competency Management</h2>
                    <p className="text-muted-foreground">
                        Manage the competency framework, proficiency levels, and learning resources.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/50 border border-border p-1 rounded-xl">
                    <TabsTrigger value="dictionary" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Book className="w-4 h-4 mr-2" />
                        Dictionary
                    </TabsTrigger>
                    <TabsTrigger value="library" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Library className="w-4 h-4 mr-2" />
                        Library
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dictionary" className="space-y-4">
                    <AdminCompetencyDictionaryTab
                        data={dictionary}
                        onRefresh={fetchData}
                    />
                </TabsContent>

                <TabsContent value="library" className="space-y-4">
                    <AdminCompetencyLibraryTab
                        data={library}
                        dictionary={dictionary}
                        companies={companies}
                        onRefresh={fetchData}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
