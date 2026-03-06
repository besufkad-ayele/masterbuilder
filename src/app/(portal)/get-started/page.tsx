import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileSignature, MessageCircle, ShieldCheck } from "lucide-react";

import BrandLogo from "@/components/features/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { BRAND, CONTACT_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Get Started | Leadership Development Design Lab",
  description: "Begin your Leadership Development journey and complete the I-Capital Africa registration intake.",
};

const steps = [
  {
    title: "Share Your Intent",
    description:
      "Let us know you are ready to enroll in the next Leadership Development cohort. We will capture a few high-level details to route you to the right stream.",
    icon: MessageCircle,
  },
  {
    title: "Complete I-Capital Intake",
    description:
      "Submit the registration form on the official I-Capital Africa Contact page so their partnerships desk can verify your organization.",
    icon: FileSignature,
  },
  {
    title: "Security & Access",
    description:
      "As soon as I-Capital confirms your submission, we provision dashboard access and share your onboarding checklist.",
    icon: ShieldCheck,
  },
];

export default function GetStartedPage() {
  return (
    <div className="bg-background">
      <section className="max-w-6xl mx-auto px-6 py-16 lg:py-24 space-y-10">
        <div className="max-w-3xl space-y-6">
          <BrandLogo showTagline label="full" />
          <h1 className="text-4xl lg:text-5xl font-display leading-tight text-slate-900 dark:text-white">
            One portal to begin, one partner to approve.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            To activate your seat in the {BRAND.name} program we coordinate with our implementation partner I-Capital Africa.
            Start by submitting their contact form so our joint team can validate your request and send the contract packet.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold">
              <Link href={CONTACT_LINKS.icapitalForm} target="_blank" rel="noreferrer">
                Proceed to I-Capital Contact
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-base font-semibold">
              <Link href={`mailto:${CONTACT_LINKS.partnershipEmail}`}>Email Partnerships Desk</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/80">Need to double-check requirements?</p>
            <h2 className="text-3xl font-display leading-tight">Download the readiness checklist</h2>
            <p className="text-sm text-primary-foreground/90">
              Review the competencies, legal requirements, and data processing terms both teams align on before access is granted.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-emerald-400" />
                Executive sponsor confirmation
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-emerald-400" />
                Data processing agreement sign-off
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-emerald-400" />
                Participant roster + domains
              </li>
            </ul>
            <Button variant="outline" className="w-full bg-white text-primary font-semibold">
              Download Checklist
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
