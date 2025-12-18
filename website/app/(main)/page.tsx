import HeroSection from "@/components/home-ui/hero-section"
import TasteFirstSection from "@/components/home-ui/taste-first-section"
import AboutCourseSection from "@/components/home-ui/about-course-section"
import AboutSatSection from "@/components/home-ui/about-sat-section"
import { ReviewsSection } from "@/components/home-ui/reviews-section"
import { TipsSection } from "@/components/home-ui/tips-section"
import { FAQSection } from "@/components/home-ui/faq-section"
import { PricingSection } from "@/components/home-ui/pricing-section"
import { CTASection } from "@/components/home-ui/cta-section"
import { ContactSection } from "@/components/home-ui/contact-section"
import { Footer } from "@/components/footer"

export default function SATHomepage() {
  return (
    <div className="min-h-screen w-full ">
      {/* Floating gradient orbs for ambient background */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/30 to-blue-300/30 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/20 to-pink-300/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 py-4 relative">
        <HeroSection />
        <TasteFirstSection />
        <AboutCourseSection />
        <AboutSatSection />
        <ReviewsSection />
        <TipsSection />
        <FAQSection />
        <PricingSection />
        <CTASection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  )
}
