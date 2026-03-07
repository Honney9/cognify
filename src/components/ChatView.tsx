import { useEffect, useRef } from "react";
import { FileText, User } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: File[]; // Changed from string[] to File[] to support preview
}

interface ChatViewProps {
  messages: Message[];
  isTyping?: boolean;
  onAttachmentClick?: (file: File) => void; // New prop for preview
}

export default function ChatView({ messages, isTyping, onAttachmentClick }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-8 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.role === "user" ? "bg-primary/10 border-primary/20 text-primary" : "bg-card-bg border-card-border text-foreground"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <span className="text-[10px] font-bold">C</span>}
              </div>

              <div className="space-y-2">
                <div className={`px-4 py-3 rounded-[20px] text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card-bg border border-card-border text-foreground rounded-tl-none"
                }`}>
                  {msg.content}
                </div>

                {/* ATTACHMENT CHIPS */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {msg.attachments.map((file, i) => (
                      <div 
                        key={i} 
                        onClick={() => onAttachmentClick?.(file)} // CLICK HANDLER
                        className="flex items-center gap-1.5 bg-muted/30 border border-border px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <FileText size={12} />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3 flex-row">
              <div className="h-8 w-8 rounded-full bg-card-bg border border-card-border flex items-center justify-center text-foreground">
                <span className="text-[10px] font-bold">C</span>
              </div>
              <div className="bg-card-bg border border-card-border px-4 py-3 rounded-[20px] rounded-tl-none flex gap-1 items-center h-10">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}