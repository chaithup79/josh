import { motion } from 'framer-motion';

const pillars = [
  {
    icon: '🌱',
    title: 'Agriculture',
    description: 'Ensuring prosperity for those who feed our nation with modern farming practices and subsidies.',
  },
  {
    icon: '📚',
    title: 'Education',
    description: 'Building world-class infrastructure and curricula to empower the next generation.',
  },
  {
    icon: '⚡',
    title: 'Innovation',
    description: 'Transforming Tamil Nadu into a global tech hub through start-up ecosystems.',
  },
  {
    icon: '🏥',
    title: 'Healthcare',
    description: 'Accessible and premium medical facilities for every citizen, down to the village level.',
  },
];

export default function VisionSection() {
  return (
    <section id="vision" className="py-24 md:py-32 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="px-3 py-1 mb-6 border border-[#C79A53]/30 rounded-full">
            <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-semibold">
              THE VISION
            </span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-ivory text-center leading-[1.1]">
            A Tamil Nadu That Works <br className="hidden md:block"/>
            <span className="italic text-[#a8a196]">For Every Citizen</span>
          </h2>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-[#121212] border border-white/5 rounded-2xl p-8 hover:border-[#C79A53]/50 transition-colors duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-2xl mb-6 group-hover:bg-[#C79A53]/10 transition-colors">
                {pillar.icon}
              </div>
              <h3 className="font-outfit font-semibold text-ivory text-lg mb-3 tracking-wide">
                {pillar.title}
              </h3>
              <p className="text-[#8a857e] font-outfit text-sm leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
