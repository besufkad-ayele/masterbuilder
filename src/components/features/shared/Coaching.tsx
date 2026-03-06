import React from 'react';
import { BookOpen, Target, Award, CheckCircle } from 'lucide-react';

const Coaching = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-primary text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="glass-card p-6 sm:p-8 rounded-2xl border-white/20">
            <div className="flex gap-2 mb-4 sm:mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Believe</span>
                </div>
                <p className="text-xs sm:text-sm italic opacity-90">"Understanding the core principles and building conviction in the leadership framework."</p>
              </div>
              <div className="bg-accent/20 p-3 sm:p-4 rounded-lg border border-accent/30 ml-4 sm:ml-8">
                <p className="text-xs sm:text-sm">"I now comprehend the theoretical foundations and can articulate the key concepts with confidence."</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Know</span>
                </div>
                <p className="text-xs sm:text-sm">Excellent foundation. Ready to apply this knowledge in practical scenarios and real-world applications.</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 -left-8 w-48 h-48 sm:w-64 sm:h-64 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
        <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display leading-tight">Structured Learning<br />at Every Step</h2>
          <p className="text-base sm:text-lg opacity-80 leading-relaxed">
            Transform your professional capabilities through our comprehensive framework. Build knowledge, develop skills, and demonstrate mastery through practical application.
          </p>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-base sm:text-lg mb-1">Interactive Mastery</h4>
                <p className="text-xs sm:text-sm opacity-70">Engage with structured content designed to build foundational understanding and practical skills.</p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-base sm:text-lg mb-1">Portfolio Development</h4>
                <p className="text-xs sm:text-sm opacity-70">Build a professional portfolio showcasing your competencies and real-world achievements.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Coaching;
