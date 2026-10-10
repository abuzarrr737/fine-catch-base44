import { useState, useEffect, useCallback } from "react";
import ReportNav from "@/components/report/ReportNav";
import Metrics from "@/components/report/Metrics";
import DocumentViewer from "@/components/report/DocumentViewer";
import FindingsPanel from "@/components/report/FindingsPanel";
import ImportantPoints from "@/components/report/ImportantPoints";
import MissingInfo from "@/components/report/MissingInfo";
import Costs from "@/components/report/Costs";
import BeforeYouSign from "@/components/report/BeforeYouSign";
import AskFineCatch from "@/components/report/AskFineCatch";
import Compare from "@/components/report/Compare";
import Calculate from "@/components/report/Calculate";
import Translate from "@/components/report/Translate";
import Remind from "@/components/report/Remind";
import Global from "@/components/report/Global";
import Disclaimer from "@/components/report/Disclaimer";
import { demoDocument, demoFindings, demoMetrics } from "@/lib/demoData";
import { analyzeText, detectMissingInfo, computeMetrics, buildChecklist } from "@/lib/analysis";
import { textToParagraphs } from "@/lib/extraction";
import { storage } from "@/lib/storage";

export default function Report({ isDemo, fileName, sourceText, onBack }) {
  const [activeId, setActiveId] = useState(null);
  const [country, setCountry] = useState(() => storage.getCountry());
  const [checklist, setChecklist] = useState([]);

  const findings = isDemo ? demoFindings : analyzeText(sourceText);
  const paragraphs = isDemo ? [] : textToParagraphs(sourceText);
  const missing = isDemo
    ? detectMissingInfo(demoDocument.pages.map((p) => p.paragraphs.join(" ")).join("\n\n"), demoFindings, country)
    : detectMissingInfo(sourceText, findings, country);
  const metrics = isDemo ? demoMetrics : computeMetrics(findings, missing.items || []);

  useEffect(() => {
    const saved = storage.getChecklist();
    const fresh = buildChecklist(findings, missing.items || []);
    if (saved && saved.length === fresh.length) {
      // restore checked state by matching question text
      setChecklist(fresh.map((f) => {
        const s = saved.find((x) => x.text === f.text);
        return s ? { ...f, checked: s.checked } : f;
      }));
    } else {
      setChecklist(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, sourceText]);

  const handleSelect = useCallback((id) => setActiveId(id), []);

  function addToChecklist(question) {
    setChecklist((items) => {
      if (items.some((i) => i.text === question)) return items;
      const n = items.length + 1;
      const next = [...items, { id: `q-${n}`, label: `QUESTION ${String(n).padStart(2, "0")}`, text: question, checked: false, createdAt: Date.now() }];
      return next;
    });
  }

  const meta = isDemo
    ? `${fileName} · Agreement FC-2026-0184  ·  8 pages  ·  USD / INR example`
    : sourceText.trim()
    ? `${fileName} · Text extracted locally`
    : `${fileName} · No text extracted`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <ReportNav isDemo={isDemo} onBack={onBack} />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="eyebrow">Analysis complete</span>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", marginTop: 18, lineHeight: 0.95 }}>
              Your Fine Catch <em>Report.</em>
            </h1>
            <p style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.04em" }}>{meta}</p>
          </div>
          <button className="btn btn-secondary no-print" onClick={() => window.print()}>Print report</button>
        </div>

        <Metrics metrics={metrics} />

        {/* Viewer + Findings */}
        <div className="fc-grid-report" style={{ marginTop: 36 }}>
          <DocumentViewer isDemo={isDemo} fileName={fileName} sourceText={sourceText} paragraphs={paragraphs} findings={findings} activeId={activeId} onSelect={handleSelect} />
          <FindingsPanel findings={findings} activeId={activeId} onSelect={handleSelect} hasText={isDemo || !!sourceText.trim()} />
        </div>

        {/* Full-width sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          <ImportantPoints findings={findings} onSelect={handleSelect} />
          <MissingInfo missing={missing} onAddQuestion={addToChecklist} />
          <Costs findings={findings} isDemo={isDemo} />
          <BeforeYouSign checklist={checklist} setChecklist={setChecklist} />
          <AskFineCatch isDemo={isDemo} findings={findings} sourceText={sourceText} onAddQuestion={addToChecklist} />
          <Calculate />
          <Compare onAddQuestion={addToChecklist} />
          <Translate findings={findings} onAddQuestion={addToChecklist} />
          <Remind />
          <Global country={country} setCountry={setCountry} onAddQuestion={addToChecklist} />
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
