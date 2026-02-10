import Navbar from './Navbar'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import BenefitsSection from './BenefitsSection'
import CTASection from './CTASection'
import ContactSection from './ContactSection'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <CTASection />
        <ContactSection />
      </main>
    </>
  )
}
