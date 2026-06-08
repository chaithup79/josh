import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TamilNaduSVG from './TamilNaduSVG';
import { getLenis } from '@/hooks/useLenis';

const navLinks = [
  { label: 'VISION', target: '#vision' },
  { label: 'REFORMS', target: '#reforms' },
  { label: 'MOVEMENT', target: '#gallery' },
  { label: 'CONNECT', target: '#connect' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (target: string) => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset: 0 });
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[72px] page-padding"
        initial={{ backgroundColor: 'rgba(11, 15, 20, 0)' }}
        animate={{
          backgroundColor: scrolled ? 'rgba(11, 15, 20, 0.85)' : 'rgba(11, 15, 20, 0)',
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Wordmark */}
        <button
          onClick={() => scrollTo('#hero')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <span className="font-inter font-medium text-[13px] tracking-[0.12em] uppercase text-ivory">
            ANNAMALAI
          </span>
          <TamilNaduSVG className="w-5 h-4 text-temple-stone" />
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.target)}
              className="relative font-inter font-normal text-[11px] tracking-[0.1em] uppercase text-ivory/70 hover:text-ivory transition-colors duration-300 cursor-pointer group"
            >
              {link.label}
              <span className="absolute bottom-[-4px] left-0 w-full h-[1px] bg-sandal-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[6px] cursor-pointer"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span className="w-5 h-[1px] bg-ivory" />
          <span className="w-5 h-[1px] bg-ivory" />
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-[#050505]/95 backdrop-blur-xl flex flex-col px-8 py-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header / Close */}
            <div className="flex justify-end w-full">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 text-ivory hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex flex-col items-start justify-center flex-grow gap-8 mt-12">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.label}
                  onClick={() => scrollTo(link.target)}
                  className="font-outfit text-3xl sm:text-4xl font-light tracking-[0.15em] uppercase text-ivory/80 hover:text-[#C79A53] hover:pl-2 transition-all duration-300 cursor-pointer text-left w-full border-b border-white/5 pb-6"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            {/* Footer Decorative */}
            <motion.div 
              className="w-full flex flex-col gap-2 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-bold">
                VISIONARY LEADER — TAMIL NADU
              </span>
              <span className="font-outfit text-xs text-[#8a857e]">
                © 2024 K. Annamalai. All Rights Reserved.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
