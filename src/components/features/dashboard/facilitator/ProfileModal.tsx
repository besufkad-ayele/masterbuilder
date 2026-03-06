"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Target,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
  Star,
  Settings,
  LogOut,
  Shield,
  Edit
} from "lucide-react";

interface ProfileModalProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
    department?: string;
    location?: string;
    phone?: string;
    joinDate?: string;
  };
  onLogout?: () => void;
}

export default function ProfileModal({ children, user, onLogout }: ProfileModalProps) {
  const [open, setOpen] = useState(false);

  // Mock user data - in real app, this would come from your auth context
  const userData = user || {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@leadershiplab.com",
    role: "Senior Facilitator",
    department: "Leadership Development",
    location: "Nairobi, Kenya",
    phone: "+254 712 345 678",
    joinDate: "January 15, 2023"
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      window.location.href = '/login';
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-[#1B4332]" />
            Profile Details
          </DialogTitle>
          <DialogDescription>
            Manage your profile information and account settings
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Profile Header */}
            <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{userData.name}</h2>
                    <p className="text-white/80 font-medium">{userData.role}</p>
                    <p className="text-white/60 text-sm mt-1">{userData.department}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#1B4332]" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8]">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#8B9B7E]" />
                    <div>
                      <p className="text-sm text-[#8B9B7E]">Email Address</p>
                      <p className="font-medium text-[#1B4332]">{userData.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8]">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-[#8B9B7E]" />
                    <div>
                      <p className="text-sm text-[#8B9B7E]">Phone Number</p>
                      <p className="font-medium text-[#1B4332]">{userData.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8]">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#8B9B7E]" />
                    <div>
                      <p className="text-sm text-[#8B9B7E]">Location</p>
                      <p className="font-medium text-[#1B4332]">{userData.location}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8]">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-[#8B9B7E]" />
                    <div>
                      <p className="text-sm text-[#8B9B7E]">Join Date</p>
                      <p className="font-medium text-[#1B4332]">{userData.joinDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Performance Metrics */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#1B4332]" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">24</p>
                  <p className="text-sm text-blue-700">Active Cohorts</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">156</p>
                  <p className="text-sm text-green-700">Learners Trained</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">89%</p>
                  <p className="text-sm text-purple-700">Completion Rate</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">4.8</p>
                  <p className="text-sm text-orange-700">Average Rating</p>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#1B4332]" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1B4332]">Completed Leadership Essentials Module</p>
                      <p className="text-sm text-[#8B9B7E]">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1B4332]">Started new cohort: Q1 Leadership Program</p>
                      <p className="text-sm text-[#8B9B7E]">1 day ago</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#FDFCF6] p-4 rounded-xl border border-[#E8E4D8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1B4332]">Received Excellence in Facilitation Award</p>
                      <p className="text-sm text-[#8B9B7E]">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Settings */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#1B4332]" />
                Account Settings
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-[#E8E4D8]">
                  <Shield className="w-4 h-4 mr-3 text-[#1B4332]" />
                  Privacy & Security Settings
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-[#E8E4D8]">
                  <Settings className="w-4 h-4 mr-3 text-[#1B4B332]" />
                  Notification Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-[#E8E4D8]">
                  <BookOpen className="w-4 h-4 mr-3 text-[#1B4332]" />
                  Learning Preferences
                </Button>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
