import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

import Footer from "@/components/Footer";
import CommunityCircles from "@/components/CommunityCircles";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <CommunityCircles />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </main>
    
  );
}