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
import { FileText, Users, AlertTriangle, Award, Clock, Shield } from "lucide-react";

interface TermsModalProps {
  children: React.ReactNode;
}

export default function TermsModal({ children }: TermsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-green-600" />
            Terms & Conditions
          </DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Agreement to Terms */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Agreement to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Leadership Design Lab. These Terms & Conditions ("Terms") govern your access to and use of 
                our platform, services, and website (collectively, the "Service"). By accessing or using Leadership Design Lab, 
                you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                Service Description
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Leadership Design Lab is a competency-based leadership development platform that provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Interactive leadership training modules and courses</li>
                <li>Competency assessment and evaluation tools</li>
                <li>Personalized learning paths and recommendations</li>
                <li>Portfolio development and artifact management</li>
                <li>Mentorship and peer collaboration features</li>
                <li>Certification and credentialing services</li>
                <li>Analytics and progress tracking dashboards</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                User Responsibilities
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Maintain the confidentiality of your login credentials</li>
                    <li>• Notify us immediately of unauthorized access</li>
                    <li>• Use a strong, unique password</li>
                    <li>• Log out of shared devices after use</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Content Standards</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Provide accurate and truthful information</li>
                    <li>• Submit original work for assessments</li>
                    <li>• Respect intellectual property rights</li>
                    <li>• Maintain professional communication</li>
                    <li>• Refrain from harassment or discriminatory behavior</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Learning Commitment</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Complete required assessments honestly</li>
                    <li>• Engage actively in learning activities</li>
                    <li>• Provide constructive feedback to peers</li>
                    <li>• Follow mentorship guidelines</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Intellectual Property Rights</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Our Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All content on Leadership Design Lab, including but not limited to text, graphics, logos, images, 
                    videos, software, and training materials, is owned by or licensed to Leadership Design Lab and is 
                    protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">User-Generated Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You retain ownership of content you submit, but you grant us a worldwide, non-exclusive, royalty-free 
                    license to use, reproduce, modify, and display your content for the purpose of providing and improving our services.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Restrictions</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>You may not copy, modify, distribute, or create derivative works</li>
                    <li>You may not reverse engineer or attempt to extract source code</li>
                    <li>You may not use our content for commercial purposes</li>
                    <li>You may not remove copyright or trademark notices</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Payment & Subscription */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Payment & Subscription Terms
              </h2>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Subscription Fees</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Fees are charged in advance on a recurring basis</li>
                    <li>• All fees are non-refundable except as required by law</li>
                    <li>• Prices are subject to change with 30 days notice</li>
                    <li>• Payment processing is handled through secure third-party providers</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Cancellation Policy</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• You may cancel your subscription at any time</li>
                    <li>• Cancellation takes effect at the end of the current billing period</li>
                    <li>• No refunds for partial months or unused portions</li>
                    <li>• Access to content ends upon cancellation</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Limitations & Liability */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-green-500" />
                Limitations & Liability
              </h2>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-red-800">Disclaimer of Warranties</h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Leadership Design Lab is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations 
                  or warranties of any kind, express or implied, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Accuracy or reliability of content and assessments</li>
                  <li>Availability or uninterrupted operation of the service</li>
                  <li>Results or outcomes from using our platform</li>
                  <li>Compatibility with your specific devices or software</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-2">Limitation of Liability</h4>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, Leadership Design Lab shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited to loss of profits, 
                  data, use, or goodwill, arising out of or relating to your use of the service.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Breach of these Terms</li>
                <li>Violation of applicable laws</li>
                <li>Fraudulent or illegal activities</li>
                <li>Harassment of other users</li>
                <li>Technical or security issues</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Governing Law & Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions. Any disputes arising from these Terms shall be 
                resolved through binding arbitration in accordance with the rules of [Arbitration Organization].
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms & Conditions, please contact us:
              </p>
              <div className="bg-green-50 p-4 rounded-lg mt-3">
                <p className="font-medium">Leadership Design Lab</p>
                <p className="text-sm text-muted-foreground">Email: legal@leadershiplab.com</p>
                <p className="text-sm text-muted-foreground">Address: [Your Business Address]</p>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setOpen(false)}>Accept Terms</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
