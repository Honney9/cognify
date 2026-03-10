import { useState, useEffect } from "react";
import { PanelLeft, FileIcon, X, Download, FileText } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import PromptUI from "@/components/PromptUI";
import ChatView, { Message } from "@/components/ChatView";
import ContentHistoryView from "@/components/ContentHistoryView";
import ModelManager from "@/components/ModelManager";
import { saveFileOffline } from "@/services/db"; 
import { useCognify } from "@/hooks/useCognify";
import * as mammoth from "mammoth"; // 1. Import Mammoth

type View = "prompt" | "chat" | { folder: string };

type AIResponse = {
  success: boolean;
  result?: string;
  error?: string;
  modelOutput?: any;
};

const Index = () => {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<View>("prompt");
  const [sessionKey, setSessionKey] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // File Preview State
  const [viewingFile, setViewingFile] = useState<File | Blob | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [docxHtml, setDocxHtml] = useState<string>(""); // 2. State for Word HTML

  const { analyze } = useCognify();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSendMessage = async ({
  type,
  prompt,
  files
}: {
  type: string | null;
  prompt: string;
  files: File[];
}) => {

  const userMsg: Message = {
    id: Date.now().toString(),
    role: "user",
    content: prompt || (files.length > 0 ? `Sent ${files.length} file(s)` : ""),
    attachments: files
  };

  setMessages(prev => [...prev, userMsg]);
  setView("chat");
  setIsTyping(true);

  try {

    const response = await analyze({
      type: type || "chat",
      prompt,
      files
    }) as AIResponse;

    /* ----------------------------- */
    /* SAVE FILES AFTER AI ANALYSIS  */
    /* ----------------------------- */

    for (const file of files) {

      let category = "Documents";

      if (response?.modelOutput?.sensitive === true) {
        category = "Secure Vault";
      }
      else if (file.type.startsWith("image/")) {
        category = file.type === "image/png" ? "Screenshots" : "Photos";
      }
      else if (file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css|json)$/)) {
        category = "Code";
      }

      await saveFileOffline(file, category);

      console.log("Saved:", file.name, "→", category);
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.success
        ? (response.result ?? "Analysis complete.")
        : (response.error ?? "The AI encountered an error during processing.")
    };

    setMessages(prev => [...prev, aiMsg]);

  } catch (err) {

    console.error("AI Pipeline Error:", err);

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Critical error: The AI worker failed to respond."
    }]);

    } finally {

      setIsTyping(false);

    }

  };

  const activeFolder = typeof view === "object" ? view.folder : null;

  // 3. Updated openPreview to handle .docx conversion
  const openPreview = async (file: File | Blob, name: string) => {
    setViewingFile(file);
    setViewingFileName(name);
    setDocxHtml(""); // Reset

    if (name.toLowerCase().endsWith(".docx")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocxHtml(result.value);
      } catch (error) {
        console.error("Docx preview error:", error);
        setDocxHtml("<p class='text-destructive'>Error loading Word document preview.</p>");
      }
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden text-foreground">
      <ModelManager />
      
      {viewingFile && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-5xl h-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-primary" />
                <span className="font-semibold truncate max-w-xs md:max-w-md">{viewingFileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const url = URL.createObjectURL(viewingFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = viewingFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => { setViewingFile(null); setDocxHtml(""); }} className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex justify-center bg-background/50">
              {viewingFile.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(viewingFile)} alt="preview" className="max-w-full h-auto object-contain rounded-lg shadow-sm" />
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe src={URL.createObjectURL(viewingFile)} className="w-full h-full rounded-lg border-none bg-white shadow-sm" title="PDF Preview" />
              ) : docxHtml ? (
                /* 4. Word Document Render Area */
                <div className="w-full h-full bg-white text-black rounded-lg p-10 overflow-auto shadow-sm prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
                </div>
              ) : (
                <div className="w-full h-full bg-muted/20 rounded-xl p-8 border border-border flex flex-col items-center justify-center text-center">
                  <FileText size={64} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Previewing: {viewingFileName}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">Analysis is available in the chat window.</p>
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
        onNewSession={() => { setSessionKey(prev => prev + 1); setMessages([]); setView("prompt"); }}
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
                  onPreviewFile={(file) => openPreview(file, file.name)} 
               />
            </div>
          )}

          {view === "chat" && (
            <div className="flex-1 flex flex-col h-full">
              <ChatView 
                messages={messages} 
                isTyping={isTyping} 
                onAttachmentClick={(file) => openPreview(file, file.name)} 
              />
              <div className="pb-8 pt-2">
                <PromptUI 
                  onSend={handleSendMessage} 
                  showWelcome={false} 
                  onPreviewFile={(file) => openPreview(file, file.name)} 
                />
              </div>
            </div>
          )}

          {typeof view === "object" && (
            <div className="flex-1 h-full">
              <ContentHistoryView 
                folder={view.folder} 
                onNavigate={(f) => setView({ folder: f })} 
                onPreviewFile={(item) => openPreview(item.blob, item.name)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;