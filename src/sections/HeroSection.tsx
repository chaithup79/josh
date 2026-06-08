import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Parallax transform only for background to keep it safe on mobile
  const bgY = useTransform(scrollY, [0, vh], [0, vh * 0.3]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center overflow-hidden bg-[#050505]"
    >
      {/* Background with deep fade */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: bgY }}
      >
        <img
          src="/images/royal-bg.png"
          alt="Background"
          className="w-full h-full object-cover object-center opacity-20"
        />
        {/* Radial gradient to focus on the content and fade edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#050505]/80 to-[#050505]" />
        {/* Linear gradient to fade bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
      </motion.div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 flex flex-col lg:flex-row items-center justify-between pt-24 pb-12 lg:pt-32 lg:pb-16 min-h-[85vh]">
        
        {/* Left Column: Text & CTA */}
        <motion.div 
          className="w-full lg:w-[55%] flex flex-col items-start pt-12 lg:pt-0"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Pill Badge */}
          <div className="flex items-center gap-3 px-4 py-1.5 border border-[#C79A53]/30 bg-[#111]/40 rounded-full mb-8">
            <div className="w-3.5 h-3.5 rounded-full bg-[#C79A53] flex items-center justify-center text-[7px]">
              ★
            </div>
            <span className="font-outfit text-[9px] md:text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-bold">
              VISIONARY LEADER — TAMIL NADU
            </span>
          </div>

          <h1 className="font-playfair text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] leading-[1.1] text-ivory mb-6 font-normal tracking-tight">
            Serving <span className="italic text-[#C79A53]">Tamil Nadu,</span><br/>
            Empowering Every<br/>
            <span className="text-[#C79A53]">Citizen</span>
          </h1>
          
          <p className="font-outfit text-[#8a857e] text-base md:text-lg max-w-md mb-10 leading-relaxed font-light">
            A visionary leader dedicated to public service — championing inclusive development, social justice, and Tamil Nadu's rise.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-12 sm:mb-16 w-full">
            <button className="w-full sm:w-auto bg-[#C79A53] hover:bg-[#b08543] text-[#111] px-7 py-3.5 rounded-full font-outfit text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(199,154,83,0.2)]">
              OUR MISSIONS 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="w-full sm:w-auto text-ivory bg-[#111]/80 hover:bg-[#222] px-7 py-3.5 rounded-full font-outfit text-xs tracking-widest uppercase border border-white/10 transition-colors shadow-lg">
              PUBLIC GRIEVANCE
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-8 md:gap-12 pt-8 border-t border-white/10 w-full max-w-xl">
            <div className="flex flex-col">
              <span className="text-[#C79A53] font-outfit text-2xl font-semibold mb-1">7Cr+</span>
              <span className="text-[#8a857e] font-outfit text-xs uppercase tracking-wider">Citizens Impacted</span>
            </div>
            <div className="hidden sm:block w-[1px] h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[#C79A53] font-outfit text-2xl font-semibold mb-1">200+</span>
              <span className="text-[#8a857e] font-outfit text-xs uppercase tracking-wider">Promises Kept</span>
            </div>
            <div className="hidden sm:block w-[1px] h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[#C79A53] font-outfit text-2xl font-semibold mb-1">100%</span>
              <span className="text-[#8a857e] font-outfit text-xs uppercase tracking-wider">Commitment</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Portrait Image */}
        <motion.div 
          className="w-full lg:w-[40%] relative mt-16 lg:mt-0 flex justify-center lg:justify-end items-center z-0 md:z-10"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, delay: 0.2 }}
        >
          <div className="relative w-[85%] max-w-[380px] lg:max-w-[420px]">
            {/* Top Right Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute -top-6 -right-4 md:-top-6 md:-right-6 bg-[#111] border border-white/10 rounded-2xl p-3 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-20 backdrop-blur-md"
            >
              <span className="font-outfit text-[8px] tracking-[0.2em] text-[#8a857e] uppercase font-bold mb-1">
                CONSTITUENCY
              </span>
              <span className="font-playfair text-ivory text-base font-medium">
                Coimbatore
              </span>
            </motion.div>

            {/* Image Wrapper */}
            <div className="relative w-full h-[500px] lg:h-[600px] z-10" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))' }}>
              <img
                src="/images/annamalai_new.jpg"
                alt="K. Annamalai"
                className="w-full h-full object-cover object-[center_20%] rounded-tl-[80px] rounded-tr-3xl rounded-bl-3xl rounded-br-3xl border border-white/10"
              />
            </div>

            {/* Bottom Left Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute bottom-12 -left-6 md:-left-10 bg-[#111] border border-white/10 rounded-xl py-3 px-5 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-20 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner">
                <span className="text-[#C79A53] text-2xl leading-none -mt-1">★</span>
              </div>
              <div className="flex flex-col">
                <span className="font-outfit text-[8px] tracking-[0.2em] text-[#8a857e] uppercase font-bold mb-0.5">
                  PARTY ROLE
                </span>
                <span className="font-playfair text-ivory text-[15px] font-bold tracking-wide">
                  State President
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
