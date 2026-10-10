import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { useState, useCallback } from "react";
import Landing from "@/pages/Landing";
import Analysis from "@/pages/Analysis";
import Report from "@/pages/Report";
import { extractText } from "@/lib/extraction";
import { demoFileName } from "@/lib/demoData";

function FineCatchApp() {
  const [screen, setScreen] = useState("landing");
  const [fileName, setFileName] = useState(demoFileName);
  const [isDemo, setIsDemo] = useState(true);
  const [sourceText, setSourceText] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  }, []);

  function startDemo() {
    setFileName(demoFileName);
    setIsDemo(true);
    setSourceText("");
    setScreen("analysis");
  }

  async function handleFile(file) {
    try {
      const { text, image } = await extractText(file);
      setFileName(file.name);
      setIsDemo(false);
      setSourceText(text);
      if (image) {
        showToast("This image was uploaded, but local OCR is not enabled yet. Try the original PDF, DOCX, or TXT file for readable findings.");
      } else if (!text.trim()) {
        showToast("Fine Catch could not read this file. Try exporting it again as a text-based PDF, DOCX, or TXT.");
      }
      setScreen("analysis");
    } catch (e) {
      if (e.message === "unsupported") {
        showToast("This file type isn't supported yet.");
      } else {
        showToast("Fine Catch could not read this file. Try exporting it again as a text-based PDF, DOCX, or TXT.");
      }
    }
  }

  return (
    <>
      {screen === "landing" && <Landing onDemo={startDemo} onFile={handleFile} toast={showToast} />}
      {screen === "analysis" && (
        <Analysis fileName={fileName} isDemo={isDemo} onDone={() => setScreen("report")} />
      )}
      {screen === "report" && (
        <Report isDemo={isDemo} fileName={fileName} sourceText={sourceText} onBack={() => setScreen("landing")} />
      )}
      {toastMsg && <div className="fc-toast no-print" role="alert">{toastMsg}</div>}
    </>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#07171b" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "rgba(156,221,218,0.14)", borderTopColor: "var(--cyan)" }}></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<FineCatchApp />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
