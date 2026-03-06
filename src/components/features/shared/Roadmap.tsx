import React from 'react';
import { Button } from '@/components/ui/button';
import { School, Lock, Gem, Award } from 'lucide-react';

const Roadmap = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-12 sm:mb-16 lg:mb-20">
        <span className="text-accent text-xs font-bold tracking-widest uppercase mb-4 block">The Roadmap</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display mb-4 sm:mb-6 dark:text-white">Competency Levels</h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
          A structured path from fundamental understanding to industry-recognized mastery. Progress through levels as you build your professional portfolio.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="relative p-6 sm:p-8 rounded-2xl border-2 border-primary bg-white dark:bg-slate-800 dark:border-white/20 shadow-xl scale-105 z-10">
          <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center mb-4 sm:mb-6">
            <School className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg mb-2 dark:text-white">Basic</h4>
          <p className="text-xs text-slate-500 mb-4 sm:mb-6 uppercase tracking-widest">Foundation &amp; Theory</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Master the fundamental concepts and theoretical frameworks. Build a strong foundation in core competencies through structured learning.
          </p>
          <Button className="w-full py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-md">Unlocked</Button>
        </div>
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
            <Lock className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg mb-2 dark:text-white">Intermediate</h4>
          <p className="text-xs text-slate-500 mb-4 sm:mb-6 uppercase tracking-widest">Application &amp; Practice</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Apply theoretical knowledge to real-world scenarios. Develop practical skills through hands-on projects and case studies.
          </p>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
            <Award className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg mb-2 dark:text-white">Advanced</h4>
          <p className="text-xs text-slate-500 mb-4 sm:mb-6 uppercase tracking-widest">Specialization &amp; Depth</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Deepen your expertise in specific domains. Tackle complex challenges and refine your technical proficiency in specialized areas.
          </p>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
            <Gem className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-lg mb-2 dark:text-white">Expert</h4>
          <p className="text-xs text-slate-500 mb-4 sm:mb-6 uppercase tracking-widest">Mastery &amp; Leadership</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            Achieve industry-recognized mastery. Lead complex initiatives and mentor others while demonstrating advanced competency.
          </p>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
