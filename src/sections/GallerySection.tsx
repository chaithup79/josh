import { motion } from 'framer-motion';

const projects = [
  {
    image: '/images/gallery-metro-4k.png',
    title: 'Namma Metro Phase III',
    status: 'ON TRACK',
  },
  {
    image: '/images/gallery-highway-4k.png',
    title: 'Statewide Expressway Network',
    status: 'IN PROGRESS',
  },
  {
    image: '/images/gallery-heritage-4k.png',
    title: 'Madurai Heritage Smart City',
    status: 'COMPLETED',
  },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="py-24 md:py-32 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="px-3 py-1 mb-6 border border-[#C79A53]/30 rounded-full">
            <span className="font-outfit text-[10px] tracking-[0.2em] text-[#C79A53] uppercase font-semibold">
              INFRASTRUCTURE
            </span>
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-ivory text-center leading-[1.1] mb-4">
            Tamil Nadu&apos;s Transformation <br className="hidden md:block"/>
            <span className="italic text-[#a8a196]">On The Ground</span>
          </h2>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
            >
              {/* Image */}
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-outfit text-[10px] tracking-[0.1em] text-green-400 uppercase font-bold">
                    {project.status}
                  </span>
                </div>
                <h3 className="font-outfit font-medium text-white text-lg tracking-wide">
                  {project.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
