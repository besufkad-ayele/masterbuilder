"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import BrandLogo from '../features/shared/BrandLogo';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: Array<{ href: string; label: string; hasDropdown: boolean }> = [];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm' 
        : 'bg-background/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link href="/" aria-label="Leadership Development home" className="shrink-0">
          <BrandLogo iconClassName="w-6 h-6 sm:w-8 sm:h-8" />
        </Link>
        
        {/* Desktop Navigation */}
        {navItems.length > 0 ? (
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                <Link
                  href={item.href}
                  className="hover:text-accent transition-colors flex items-center gap-1 py-2"
                  onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.label)}
                  onMouseLeave={() => item.hasDropdown && setActiveDropdown(null)}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="h-3 w-3" />}
                </Link>
                {item.hasDropdown && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2">
                    <Link href="#" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Overview</Link>
                    <Link href="#" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Examples</Link>
                    <Link href="#" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Resources</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
        
        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <a
            
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Link href="https://icapital-group-temp.vercel.app/">Contact Us</Link>
          </a>
          {/* <Button
            asChild
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Link href="/get-started">Start Training</Link>
          </Button> */}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 transition-transform duration-300 rotate-90" />
          ) : (
            <Menu className="h-5 w-5 transition-transform duration-300" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-background/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            {navItems.length > 0 ? (
              <div className="flex flex-col space-y-3 text-sm font-medium">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="hover:text-accent transition-colors py-2 flex items-center justify-between"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown className="h-3 w-3" />}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                variant="ghost" 
                className="text-sm font-medium justify-start hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
                asChild
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/get-started">Start Training</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
