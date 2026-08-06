import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import CommunityCircles from "@/components/CommunityCircles";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
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
