import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "The 'En Mann En Makkal' yatra brought a renewed sense of hope. Finally, we have a leader who listens to our struggles on the ground.",
    name: "Karthik R.",
    role: "Working Professional",
  },
  {
    quote: "The focus on clean governance is exactly what our state needs. As a farmer, I feel my voice is finally being heard without corruption.",
    name: "Muthusamy",
    role: "Farmer",
  },
  {
    quote: "Empowering the youth and standing up for our cultural identity makes me proud to support this vision for our future.",
    name: "Meenakshi V.",
    role: "Student",
  },
];

export default function ConnectSection() {
  return (
    <section id="connect" className="py-24 md:py-32 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Testimonials Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="px-3 py-1 mb-6 border border-[#C79A53]/30 rounded-full">
            <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-semibold">
              TESTIMONIALS
            </span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-ivory text-center leading-[1.1]">
            Hear From the <br className="hidden md:block"/>
            <span className="italic text-[#a8a196]">People of Tamil Nadu</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 flex flex-col justify-between"
            >
              <div className="mb-8 text-[#8a857e] font-outfit leading-relaxed">
                "{t.quote}"
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C79A53] flex items-center justify-center font-playfair text-black text-xl font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-outfit text-sm font-semibold">{t.name}</div>
                  <div className="text-[#8a857e] font-outfit text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Voice Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-white/10"
        >
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#C79A53] via-green-600 to-white" />

          <div className="flex flex-col md:flex-row items-center">
            {/* Left Content */}
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col items-start">
              <div className="px-3 py-1 mb-6 border border-[#C79A53]/30 rounded-full">
                <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-semibold">
                  GET INVOLVED
                </span>
              </div>
              <h3 className="font-playfair text-4xl lg:text-5xl text-ivory mb-4">
                Your Voice <br/>
                <span className="italic text-[#a8a196]">Matters to Us</span>
              </h3>
              <p className="text-[#8a857e] font-outfit text-sm md:text-base max-w-sm mb-10 leading-relaxed">
                Share your ideas, grievances, or vision for a better state. We are listening and ready to act.
              </p>
              <div className="flex gap-4">
                <button onClick={() => alert('Opening feedback form...')} className="bg-[#C79A53] hover:bg-[#b08543] text-[#111] px-6 py-2.5 rounded-full font-outfit text-xs tracking-widest uppercase font-semibold transition-colors cursor-pointer">
                  SHARE IDEAS
                </button>
                <button onClick={() => alert('Redirecting to volunteer portal...')} className="text-ivory px-6 py-2.5 rounded-full font-outfit text-xs tracking-widest uppercase border border-white/20 hover:bg-white/10 transition-colors cursor-pointer">
                  VOLUNTEER
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="w-full md:w-1/2 h-64 md:h-full min-h-[400px] relative">
              <img
                src="/images/voice-building-4k.png"
                alt="Government Building"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
