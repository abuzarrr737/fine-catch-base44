import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import FinePrint from "@/components/landing/FinePrint";
import WhoFor from "@/components/landing/WhoFor";
import WhatWeCatch from "@/components/landing/WhatWeCatch";
import HiddenCost from "@/components/landing/HiddenCost";
import HowItWorks from "@/components/landing/HowItWorks";
import GlobalProblem from "@/components/landing/GlobalProblem";
import UploadSection from "@/components/landing/UploadSection";
import Roadmap from "@/components/landing/Roadmap";
import ClosingCTA from "@/components/landing/ClosingCTA";
import Footer from "@/components/landing/Footer";
import FeatureModal from "@/components/landing/FeatureModal";
import { useState } from "react";
import { storage } from "@/lib/storage";

export default function Landing({ onDemo, onFile, toast }) {
  const [country, setCountry] = useState(() => storage.getCountry());
  const [feature, setFeature] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      <Nav onDemo={onDemo} onAnalyze={() => document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" })} />
      <Hero onDemo={onDemo} onAnalyze={() => document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" })} />
      <TrustStrip />
      <FinePrint />
      <WhoFor />
      <WhatWeCatch onFeature={(f) => setFeature(f)} />
      <HiddenCost onCalculate={() => setFeature("calculate")} />
      <HowItWorks />
      <GlobalProblem country={country} setCountry={(c) => { setCountry(c); storage.saveCountry(c); }} onGlobal={() => setFeature("global")} />
      <UploadSection onFile={onFile} onDemo={onDemo} toast={toast} />
      <Roadmap onFeature={(f) => setFeature(f)} />
      <ClosingCTA onDemo={onDemo} onAnalyze={() => document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" })} />
      <Footer />
      {feature && <FeatureModal feature={feature} onClose={() => setFeature(null)} />}
    </div>
  );
}
