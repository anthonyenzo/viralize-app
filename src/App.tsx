import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { useAppStore } from "./store/useAppStore";
import { TwitterGenerator } from "./features/twitter/TwitterGenerator";
import { QuoteGenerator } from "./features/quote/QuoteGenerator";
import { ReelsCreator } from "./features/reels/ReelsCreator";
import { Settings } from "./components/settings/Settings";
import { Login } from "./features/auth/Login";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { activeTab } = useAppStore();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
    </div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'twitter':
        return <TwitterGenerator />;
      case 'quote':
        return <QuoteGenerator />;
      case 'reels':
        return <ReelsCreator />;
      case 'settings':
        return <Settings />;
      default:
        return <div className="p-10 text-center text-zinc-500">Ferramenta em desenvolvimento...</div>;
    }
  };

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
}

export default App;
