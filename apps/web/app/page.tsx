import CaseStudiesSection from "../components/groundwork-landing/case-studies";
import FAQSection from "../components/groundwork-landing/faqs";
import { Hero } from "../components/groundwork-landing/hero";
import ProcessSection from "../components/groundwork-landing/process";
import ReplyRateSection from "../components/groundwork-landing/reply-rate";
import TestimonialBanner from "../components/groundwork-landing/testimonial-banner";
import GroundworkEngineSection from "../components/groundwork-landing/work-engine";
import { WorkFlow } from "../components/groundwork-landing/workflow";
import GroundworkFooter from "../components/layout/footer";

export default function Home() {
  return (
    <div className="w-full space-y-24 pb-16 pt-24 md:pt-28">
      <Hero />
      <WorkFlow />
      <ProcessSection />
      <CaseStudiesSection />
      <TestimonialBanner />
      <ReplyRateSection />
      <GroundworkEngineSection />
      <FAQSection />
      <GroundworkFooter />
    </div>
  );
}
