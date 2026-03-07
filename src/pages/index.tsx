import { useState, useEffect } from "react";
import { PanelLeft, FileIcon, X, Download, FileText } from "lucide-react"; // Added Viewer Icons
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView, { Message } from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";

type View = "prompt" | "chat" | { folder: string };

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // SHARED STATE FOR VIEWING DOCUMENTS
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSendMessage = (content: string, files: File[]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content || (files.length > 0 ? `Sent ${files.length} file(s)` : ""),
      attachments: files // Store the actual File objects
    };
    
    setMessages(prev => [...prev, userMsg]);
    setView("chat");

    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've received your request. I'm currently analyzing the content and will provide a detailed response shortly."
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const activeFolder = typeof view === "object" ? view.folder : null;

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      
      {/* GLOBAL VIEWER OVERLAY */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-5xl h-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3 text-foreground">
                <FileIcon size={20} className="text-primary" />
                <span className="font-semibold truncate max-w-xs md:max-w-md">{viewingFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const url = URL.createObjectURL(viewingFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = viewingFile.name;
                    a.click();
                  }}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setViewingFile(null)} className="p-2 hover:bg-accent rounded-lg transition-colors text-foreground">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center bg-background/50">
              {viewingFile.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(viewingFile)} alt="preview" className="max-w-full h-auto object-contain rounded-lg shadow-sm" />
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe src={URL.createObjectURL(viewingFile)} className="w-full h-full rounded-lg border-none bg-white" title="PDF Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileText size={64} className="mb-4 opacity-20" />
                  <p className="text-sm">Preview not supported locally.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onNewSession={() => {
            setSessionKey(prev => prev + 1);
            setMessages([]);
            setView("prompt");
        }}
        onFolderClick={(f) => setView({ folder: f })}
        activeFolder={activeFolder}
      />

      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {!sidebarOpen && (
          <div className="absolute top-5 left-6 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent transition-all">
              <PanelLeft size={20} />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {view === "prompt" && (
            <div className="flex-1 flex items-center justify-center p-4">
               <PromptUI 
                  key={sessionKey} 
                  onSend={handleSendMessage} 
                  showWelcome={true} 
                  onPreviewFile={setViewingFile} // Ensure PromptUI can still trigger preview
               />
            </div>
          )}

          {view === "chat" && (
            <div className="flex-1 flex flex-col h-full">
              <ChatView 
                messages={messages} 
                isTyping={isTyping} 
                onAttachmentClick={setViewingFile} // Trigger preview from chat
              />
              <div className="pb-8 pt-2">
                <PromptUI 
                  onSend={handleSendMessage} 
                  showWelcome={false} 
                  onPreviewFile={setViewingFile} 
                />
              </div>
            </div>
          )}

          {typeof view === "object" && (
            <div className="flex-1 h-full">
              <ContentHistoryView folder={view.folder} onNavigate={(f) => setView({ folder: f })} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;