"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <header className="relative pt-16 sm:pt-20 pb-20 sm:pb-32 hero-gradient overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}></div>
        <div className={`absolute top-1/2 left-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        <div className={`space-y-6 sm:space-y-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold tracking-widest uppercase hover:bg-accent/20 transition-colors cursor-pointer">
            <Sparkles className="w-3 h-3" />
            The Bridge to Executive Mastery
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-display leading-tight dark:text-white">
            <span className={`inline-block transition-all duration-700 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Master.</span><br />
            <span className={`inline-block text-accent italic transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Builder.</span>
          </h1>
          <p className={`text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
Bridge the gap between concepts and high-stakes execution. Our Lab transforms conviction into tangible leadership artifacts.          </p>
          <div className={`flex flex-col sm:flex-wrap sm:flex-row gap-3 sm:gap-4 pt-4 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button size="lg" className="bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group">
              <Link href="/login">Begin Your Cycle</Link>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold border-slate-300 dark:border-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 group">
              <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent group-hover:scale-110 transition-transform" />
              The Framework
            </Button>
          </div>
          <div className={`flex items-center gap-4 pt-6 sm:pt-8 transition-all duration-700 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex -space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background dark:border-background-dark bg-slate-300 hover:z-10 transition-transform hover:scale-110"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background dark:border-background-dark bg-slate-400 hover:z-10 transition-transform hover:scale-110"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background dark:border-background-dark bg-slate-500 hover:z-10 transition-transform hover:scale-110"></div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Engineer Your Best Self 
 <span className="text-primary dark:text-white font-bold">  and </span> Lead with Purpose</p>
          </div>
        </div>
        <div className={`relative mt-8 lg:mt-0 transition-all duration-1000 delay-700 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div 
            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 transition-all duration-500 cursor-pointer ${
              hoveredCard ? 'rotate-0 scale-105 shadow-3xl' : 'rotate-2 hover:rotate-0'
            }`}
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
          >
            <Image
              alt="Executive dashboard visualization"
              className={`rounded-xl transition-all duration-700 w-full h-auto ${
                hoveredCard ? 'grayscale-0' : 'grayscale hover:grayscale-0'
              }`}

              src="/hero.jpg"
              width={800}
              height={500}
            />
            <div className={`absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-accent text-white p-4 sm:p-6 rounded-xl shadow-xl max-w-[200px] sm:max-w-[240px] transition-all duration-300 ${
              hoveredCard ? 'scale-105 shadow-2xl' : ''
            }`}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2"></p>
              <p className="text-sm sm:text-2xl font-display leading-tight">LEADERSHIP DESIGN LAB</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
