import CaseStudiesSection from "../components/landing/case-studies";
import FAQSection from "../components/landing/faqs";
import { Hero } from "../components/landing/hero";
import ProcessSection from "../components/landing/process";
import ReplyRateSection from "../components/landing/reply-rate";
import BrandStatement from "../components/landing/testimonial-banner";
import ReviewEngineSection from "../components/landing/work-engine";
import { WorkFlow } from "../components/landing/workflow";
import SiteFooter from "../components/layout/footer";

export default function Home() {
  return (
    <div className="w-full space-y-24 pb-16 pt-24 md:pt-28">
      <Hero />
      <WorkFlow />
      <ProcessSection />
      <CaseStudiesSection />
      <BrandStatement />
      <ReplyRateSection />
      <ReviewEngineSection />
      <FAQSection />
      <SiteFooter />
    </div>
  );
}
