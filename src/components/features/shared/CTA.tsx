"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, Clock, User, Book } from 'lucide-react';

const CTA = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="bg-primary rounded-[3rem] p-16 text-center text-white relative overflow-hidden group">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative z-10 space-y-8">
          <h2 className="text-5xl font-display max-w-2xl mx-auto">Ready to build your professional edge?</h2>
          <p className="text-xl opacity-80 max-w-xl mx-auto">
            Enter the Workplace Success Dashboard and start your first Mastery Cycle today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className={`${isHovered ? 'bg-accent text-primary' : 'bg-transparent text-accent' } px-10 py-4 rounded-full font-bold hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg `}
              onMouseEnter={() => setIsHovered(false)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Link href="https://icapital-group-temp.vercel.app/" target="_blank" rel="noopener noreferrer">
                Contact Us <ArrowRight className={`h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 hover:bg-white/20 px-10 py-4 rounded-full font-bold backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-105"
            >
              <Link href="/login">Log In to Dashboard</Link>
            </Button>
          </div>
          {/* <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10 max-w-3xl mx-auto">
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-accent mr-1" />
                <p className="text-3xl font-bold">35+</p>
              </div>
              <p className="text-xs uppercase tracking-widest opacity-60">Fellows</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Book className="h-5 w-5 text-accent mr-1" />
                <p className="text-3xl font-bold">8+</p>
              </div>
              <p className="text-xs uppercase tracking-widest opacity-60">Competencies</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-accent mr-1" />
                <p className="text-3xl font-bold">6 Months </p>
              </div>
              <p className="text-xs uppercase tracking-widest opacity-60">Mastery time</p>
            </div>
          </div> */}
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full transition-transform duration-1000 group-hover:scale-110" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.7,-63.3C61.4,-54.6,71.7,-39.8,76.5,-23.6C81.3,-7.4,80.7,10.2,74.5,25.8C68.4,41.4,56.7,55,42.4,63.9C28.2,72.9,11.4,77.2,-5.1,84.3C-21.7,91.3,-38.1,101.1,-52,97.3C-65.8,93.5,-77,76.1,-83.4,58C-89.8,39.9,-91.4,21.1,-87.3,4.4C-83.3,-12.3,-73.6,-26.8,-63.1,-39.1C-52.6,-51.4,-41.2,-61.6,-28.4,-67.9C-15.6,-74.1,-1.3,-76.3,12.7,-74.2C26.6,-72,41.1,-65.4,47.7,-63.3Z" fill="currentColor" transform="translate(200 200)"></path>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default CTA;
