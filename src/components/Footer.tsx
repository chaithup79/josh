import TamilNaduSVG from './TamilNaduSVG';
import { Twitter, Instagram, Facebook } from 'lucide-react';

const socialIcons = [
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Facebook, label: 'Facebook' },
];

export default function Footer() {
  return (
    <footer className="border-t border-ivory/[0.06]">
      <div className="page-padding py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="font-inter font-medium text-[12px] tracking-[0.12em] uppercase text-ivory">
              ANNAMALAI
            </span>
            <TamilNaduSVG className="w-4 h-3 text-temple-stone" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 font-outfit font-light text-[10px] text-ivory/40">
            <span>&copy; 2024 — All rights reserved.</span>
            <span className="hidden md:inline">|</span>
            <a 
              href="https://consultandwin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#C79A53] transition-colors duration-300 uppercase tracking-widest"
            >
              Developed by Consult & Win
            </a>
          </div>
        </div>

        {/* Right — Social */}
        <div className="flex items-center gap-5">
          {socialIcons.map(({ Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="text-ivory/40 hover:text-ivory hover:scale-110 transition-all duration-200"
            >
              <Icon size={18} strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
