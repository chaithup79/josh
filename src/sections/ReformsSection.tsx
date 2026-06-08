import { motion } from 'framer-motion';
import {
  Shield,
  Rocket,
  Tractor,
  Droplets,
  Cpu,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ReformCardData {
  icon: LucideIcon;
  title: string;
  description: string;
  linkText: string;
}

const reforms: ReformCardData[] = [
  {
    icon: Shield,
    title: 'Anti-Corruption Framework',
    description: 'Zero-tolerance mechanisms with transparent public audits and digital tracking.',
    linkText: 'KNOW MORE',
  },
  {
    icon: Rocket,
    title: 'Youth Entrepreneurship',
    description: 'Seed funding and mentorship networks for Tamil Nadu\'s next innovators.',
    linkText: 'KNOW MORE',
  },
  {
    icon: Tractor,
    title: 'Rural Infrastructure',
    description: 'All-weather roads and digital connectivity reaching every village.',
    linkText: 'KNOW MORE',
  },
  {
    icon: Droplets,
    title: 'Water Management',
    description: 'Revival of traditional tank systems and smart distribution networks.',
    linkText: 'KNOW MORE',
  },
  {
    icon: Cpu,
    title: 'Digital Tamil Nadu',
    description: 'Universal high-speed internet and AI-driven governance platforms.',
    linkText: 'KNOW MORE',
  },
  {
    icon: Users,
    title: 'Public Accountability',
    description: 'Monthly town halls and direct citizen feedback loops for every department.',
    linkText: 'KNOW MORE',
  },
];

export default function ReformsSection() {
  return (
    <section id="reforms" className="py-24 md:py-32 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="px-3 py-1 mb-6 border border-[#C79A53]/30 rounded-full">
            <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-semibold">
              KEY INITIATIVES
            </span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-ivory text-center leading-[1.1]">
            Flagship Programmes for <br className="hidden md:block"/>
            <span className="italic text-[#a8a196]">Tamil Nadu&apos;s Future</span>
          </h2>
        </div>

        {/* Reforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reforms.map((reform, i) => {
            const Icon = reform.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 hover:border-[#C79A53]/30 transition-colors duration-300 flex flex-col h-full"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#C79A53]/10 flex items-center justify-center">
                    <Icon size={24} className="text-[#C79A53]" />
                  </div>
                  <h3 className="font-outfit font-semibold text-ivory text-lg tracking-wide">
                    {reform.title}
                  </h3>
                </div>
                <p className="text-[#8a857e] font-outfit text-sm leading-relaxed mb-8 flex-grow">
                  {reform.description}
                </p>
                <button className="self-start text-[#C79A53] border border-[#C79A53]/30 hover:bg-[#C79A53]/10 px-6 py-2 rounded-full font-outfit text-xs tracking-widest uppercase font-semibold transition-colors">
                  {reform.linkText}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
