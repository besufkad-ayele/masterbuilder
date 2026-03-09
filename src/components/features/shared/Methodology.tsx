"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Methodology = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const cards = [
    {
      icon: Sparkles,
      title: "Believe",
      description: "Mindset & Foundation. Challenge core assumptions and align your personal values with leadership principles to build an unshakable core."
    },
    {
      icon: BookOpen,
      title: "Know", 
      description: "Theories & Frameworks. Master high-signal content designed for professional retention. Deep-dive into case studies and modern strategy."
    },
    {
      icon: Award,
      title: "Do",
      description: "Evidence & STAR Portfolio. Create tangible workplace artifacts—charters, maps, or reports—verified by AI and executive mentors."
    }
  ];

  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-6 text-center mb-20">
        <span className="text-accent text-xs font-bold tracking-widest uppercase mb-4 block">The Methodology</span>
        <h2 className="text-5xl font-display mb-6 dark:text-white">The Leadership Cycle</h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
          Our proven framework ensures you don't just "learn" a skill—you internalize it through iterative cycles of belief, high-fidelity simulation, and evidence creation.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className={`bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 cursor-pointer ${
                hoveredCard === index 
                  ? 'shadow-2xl -translate-y-4 scale-105 border-accent/20' 
                  : 'hover:shadow-xl hover:-translate-y-2'
              }`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-8 transition-all duration-300 ${
                hoveredCard === index 
                  ? 'bg-accent text-white scale-110 shadow-lg' 
                  : 'bg-accent/10 text-accent'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-display mb-4 dark:text-white uppercase tracking-wider">{card.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {card.description}
              </p>
              {/* <div className={`mt-6 flex items-center gap-2 text-accent font-medium text-sm transition-all duration-300 ${
                hoveredCard === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                Learn more <ArrowRight className="h-4 w-4" />
              </div> */}
            </div>
          );
        })}
      </div>
      <div className="mt-16 text-center">
        <Button className="bg-primary text-white px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity hover:scale-105 shadow-lg hover:shadow-xl">
          <Link href="/login">
          Experience the cycle in dashboard →
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Methodology;
