import FAQSection from "../components/landing/faqs";
import { Hero } from "../components/landing/hero";
import ReplyRateSection from "../components/landing/reply-rate";
import ReviewEngineSection from "../components/landing/work-engine";
import SiteFooter from "../components/layout/footer";

export default function Home() {
  return (
    <div className="w-full space-y-24 pb-16 pt-24 md:pt-28">
      <Hero />
      <ReplyRateSection />
      <ReviewEngineSection />
      <FAQSection />
      <SiteFooter />
    </div>
  );
}
