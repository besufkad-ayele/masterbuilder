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
import { Shield, Eye, Lock, Database, UserCheck, FileText } from "lucide-react";

interface PrivacyPolicyModalProps {
  children: React.ReactNode;
}

export default function PrivacyPolicyModal({ children }: PrivacyPolicyModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At Leadership Design Lab, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, 
                services, and website. By using Leadership Design Lab, you consent to the practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Information We Collect
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Full name, email address, and contact information</li>
                    <li>Professional background and role information</li>
                    <li>Organization and company details</li>
                    <li>Demographic information (age, location, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Learning & Assessment Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Competency assessments and evaluation results</li>
                    <li>Training progress and completion records</li>
                    <li>Behavioral indicator performance metrics</li>
                    <li>Portfolio submissions and artifacts</li>
                    <li>Quiz scores and learning analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>IP address and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Usage patterns and interaction data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                How We Use Your Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Service Delivery</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Provide personalized learning experiences</li>
                    <li>• Track progress and competency development</li>
                    <li>• Generate certificates and credentials</li>
                    <li>• Facilitate mentor-mentee matching</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Platform Improvement</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Analyze usage patterns for optimization</li>
                    <li>• Develop new features and content</li>
                    <li>• Conduct research and analytics</li>
                    <li>• Ensure platform security</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Communication</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Send important platform notifications</li>
                    <li>• Provide customer support</li>
                    <li>• Share relevant learning resources</li>
                    <li>• Send marketing communications (with consent)</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Legal Compliance</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Comply with legal obligations</li>
                    <li>• Protect against fraud and abuse</li>
                    <li>• Enforce our terms of service</li>
                    <li>• Respond to legal requests</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Data Security & Protection
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
                <li><strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
                <li><strong>Regular Audits:</strong> Third-party security assessments and penetration testing</li>
                <li><strong>Data Backup:</strong> Secure, redundant backup systems with disaster recovery plans</li>
                <li><strong>Compliance:</strong> GDPR, CCPA, and other relevant data protection regulations</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Your Privacy Rights</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Transfer your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing of your data</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mt-3">
                <p className="font-medium">Leadership Design Lab</p>
                <p className="text-sm text-muted-foreground">Email: privacy@leadershiplab.com</p>
                <p className="text-sm text-muted-foreground">Address: [Your Business Address]</p>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setOpen(false)}>I Understand</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
