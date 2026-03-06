import React from 'react';
import Link from 'next/link';

import BrandLogo from './BrandLogo';
import { BRAND } from '@/lib/constants';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsModal from '@/components/legal/TermsModal';

const footerLinks = [
  { label: 'Get Started', href: '/get-started' },
  { label: 'Log In', href: '/login' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms', href: '#' },
];

const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="border-t border-slate-100 bg-white py-12 dark:border-slate-900 dark:bg-background-dark">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="space-y-4">
            <BrandLogo />
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
              {BRAND.description}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            {footerLinks.map((link) => {
              if (link.label === 'Privacy Policy') {
                return (
                  <PrivacyPolicyModal key={link.label}>
                    <button className="transition-colors hover:text-foreground">
                      {link.label}
                    </button>
                  </PrivacyPolicyModal>
                );
              }
              if (link.label === 'Terms') {
                return (
                  <TermsModal key={link.label}>
                    <button className="transition-colors hover:text-foreground">
                      {link.label}
                    </button>
                  </TermsModal>
                );
              }
              return (
                <Link 
                  key={link.label} 
                  href={link.href} 
                  className="transition-colors hover:text-foreground"
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 md:flex-row dark:border-slate-900">
          <span>© {currentYear} {BRAND.fullName}</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-300 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
            </span>

            <a href="https://icapital-group-temp.vercel.app" target="_blank" rel="noopener noreferrer">
              <img src="/i-Capital Africa Institute.webp" alt="Logo" className="h-15 w-30 cursor-pointer" />
            </a>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
