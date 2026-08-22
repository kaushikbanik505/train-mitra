import Hero from '../components/Hero';
import FeatureGrid from '../components/FeatureGrid';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1">
        <Hero />
        <FeatureGrid />
        <FAQ />
      </div>
      <Footer />
    </div>
  );
}
