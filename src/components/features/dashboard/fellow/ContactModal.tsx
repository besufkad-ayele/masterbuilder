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
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Users,
  Zap,
  Globe,
  Calendar,
  Shield,
  BookOpen,
  Star,
  ExternalLink
} from "lucide-react";
import { SYSTEM_ADMIN, CONTACT_INFO } from "@/lib/constants/contact";

interface ContactModalProps {
  children: React.ReactNode;
}

export default function ContactModal({ children }: ContactModalProps) {
  const [open, setOpen] = useState(false);

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsAppClick = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="h-6 w-6 text-[#1B4332]" />
            Contact Support Team
          </DialogTitle>
          <DialogDescription>
            Get in touch with our facilitators and support team for assistance
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-8">
            {/* Primary Contact - Lead Facilitator */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1B4332]" />
                Lead Facilitator
              </h3>
              <div className="bg-gradient-to-r from-[#1B4332]/5 to-transparent rounded-2xl border border-[#E8E4D8] p-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-[#1B4332]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-[#1B4332] mb-1">{SYSTEM_ADMIN.primary.name}</h4>
                    <p className="text-[#8B9B7E] font-medium mb-3">{SYSTEM_ADMIN.primary.title}</p>
                    <p className="text-sm text-[#1B4332]/70 leading-relaxed mb-4">{SYSTEM_ADMIN.primary.bio}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-[#E8E4D8]"
                        onClick={() => handleEmailClick(SYSTEM_ADMIN.primary.email)}
                      >
                        <Mail className="w-4 h-4 mr-3 text-[#1B4332]" />
                        {SYSTEM_ADMIN.primary.email}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-[#E8E4D8]"
                        onClick={() => handlePhoneClick(SYSTEM_ADMIN.primary.phone)}
                      >
                        <Phone className="w-4 h-4 mr-3 text-[#1B4332]" />
                        {SYSTEM_ADMIN.primary.phone}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Support Team */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#1B4332]" />
                Technical Support
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900">{SYSTEM_ADMIN.support.name}</h4>
                      <p className="text-sm text-blue-700">{SYSTEM_ADMIN.support.title}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">Response: {SYSTEM_ADMIN.support.responseTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_ADMIN.support.expertise.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEmailClick(SYSTEM_ADMIN.support.email)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900">{SYSTEM_ADMIN.academic.name}</h4>
                      <p className="text-sm text-purple-700">{SYSTEM_ADMIN.academic.title}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800">{SYSTEM_ADMIN.academic.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_ADMIN.academic.expertise.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => handleEmailClick(SYSTEM_ADMIN.academic.email)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Academic Support
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Organization Information */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#1B4332]" />
                Organization Information
              </h3>
              <div className="bg-[#FDFCF6] rounded-2xl p-6 border border-[#E8E4D8]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-[#1B4332] mb-3">{CONTACT_INFO.organization.name}</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#8B9B7E] mt-0.5" />
                        <span className="text-sm text-[#1B4332]">{CONTACT_INFO.organization.address}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-[#8B9B7E] mt-0.5" />
                        <span className="text-sm text-[#1B4332]">{CONTACT_INFO.organization.workingHours}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-[#8B9B7E] mt-0.5" />
                        <span className="text-sm text-[#1B4332]">Emergency: {CONTACT_INFO.organization.emergencyContact}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B4332] mb-3">Response Times</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-sm text-[#1B4332]">Email Support</span>
                        <span className="text-xs font-medium text-green-600">{CONTACT_INFO.responseTimes.email}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-sm text-[#1B4332]">Urgent Issues</span>
                        <span className="text-xs font-medium text-orange-600">{CONTACT_INFO.responseTimes.urgent}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-sm text-[#1B4332]">Technical Issues</span>
                        <span className="text-xs font-medium text-blue-600">{CONTACT_INFO.responseTimes.technical}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="text-sm text-[#1B4332]">Academic Support</span>
                        <span className="text-xs font-medium text-purple-600">{CONTACT_INFO.responseTimes.academic}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Contact Options */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-[#1B4332]" />
                Quick Contact Options
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col rounded-xl border-[#E8E4D8] hover:bg-[#FDFCF6]"
                  onClick={() => handleEmailClick(CONTACT_INFO.supportChannels.email)}
                >
                  <Mail className="w-6 h-6 mb-2 text-[#1B4332]" />
                  <span className="text-xs font-medium">Email</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col rounded-xl border-[#E8E4D8] hover:bg-[#FDFCF6]"
                  onClick={() => handlePhoneClick(CONTACT_INFO.supportChannels.phone)}
                >
                  <Phone className="w-6 h-6 mb-2 text-[#1B4332]" />
                  <span className="text-xs font-medium">Phone</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col rounded-xl border-[#E8E4D8] hover:bg-[#FDFCF6]"
                  onClick={() => handleWhatsAppClick(CONTACT_INFO.supportChannels.whatsapp)}
                >
                  <MessageCircle className="w-6 h-6 mb-2 text-[#1B4332]" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col rounded-xl border-[#E8E4D8] hover:bg-[#FDFCF6]"
                  onClick={() => window.open(CONTACT_INFO.organization.website, '_blank')}
                >
                  <ExternalLink className="w-6 h-6 mb-2 text-[#1B4332]" />
                  <span className="text-xs font-medium">Website</span>
                </Button>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
