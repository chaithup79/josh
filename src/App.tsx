import { useLenis } from '@/hooks/useLenis';
import FilmGrainOverlay from '@/components/FilmGrainOverlay';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroSection from '@/sections/HeroSection';
import VisionSection from '@/sections/VisionSection';
import ReformsSection from '@/sections/ReformsSection';
import GallerySection from '@/sections/GallerySection';
import ConnectSection from '@/sections/ConnectSection';

function App() {
  useLenis();

  return (
    <div className="relative bg-midnight min-h-screen">
      <FilmGrainOverlay />
      <Navigation />
      <main>
        <HeroSection />
        <VisionSection />
        <ReformsSection />
        <GallerySection />
        <ConnectSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
