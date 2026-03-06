import Coaching from "@/components/features/shared/Coaching";
import CTA from "@/components/features/shared/CTA";
import Footer from "@/components/features/shared/Footer";
import Hero from "@/components/features/shared/Hero";
import Methodology from "@/components/features/shared/Methodology";
import Roadmap from "@/components/features/shared/Roadmap";
import Header from "@/components/shared/Header";


export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Methodology />
      <Coaching />
      <Roadmap />
      <CTA />
      <Footer />
    </main>
  );
}
