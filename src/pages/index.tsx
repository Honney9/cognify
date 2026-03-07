import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";

type View = "prompt" | "chat" | { folder: string };

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const activeFolder = typeof view === "object" ? view.folder : null;

  // Unified handler to switch folders from Sidebar or within the History Panel
  const handleFolderNavigation = (folder: string) => {
    setView({ folder });
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <ModelManager />
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onNewSession={() => {
            setSessionKey(prev => prev + 1);
            setView("prompt");
        }}
        onFolderClick={handleFolderNavigation}
        activeFolder={activeFolder}
      />

      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Toggle Button for when Sidebar is hidden */}
        {!sidebarOpen && (
          <div className="absolute top-5 left-6 z-50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-card border border-border shadow-sm hover:bg-accent text-foreground transition-all"
            >
              <PanelLeft size={20} />
            </button>
          </div>
        )}

        {/* View Switcher Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Main Prompt (New Session) */}
          {view === "prompt" && (
            <div className="flex-1 flex items-center justify-center p-4">
               <PromptUI key={sessionKey} />
            </div>
          )}

          {/* Chat View */}
          {view === "chat" && (
            <div className="flex-1 h-full">
              <ChatView />
            </div>
          )}

          {/* My Contents / Folders / Documents */}
          {typeof view === "object" && (
            <div className="flex-1 h-full">
              <ContentHistoryView 
                folder={view.folder} 
                onNavigate={handleFolderNavigation} 
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;