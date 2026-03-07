import { useEffect, useRef } from "react";
import { FileText, User, Code, FileIcon } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: File[];
}

interface ChatViewProps {
  messages: Message[];
  isTyping?: boolean;
  onAttachmentClick?: (file: File) => void;
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
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.role === "user" ? "bg-primary/10 border-primary/20 text-primary" : "bg-card-bg border-card-border text-foreground"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <span className="text-[10px] font-bold">C</span>}
              </div>

              {/* Message Content Container */}
              <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-[20px] shadow-sm overflow-hidden border ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground border-transparent rounded-tr-none" 
                    : "bg-card-bg border-card-border text-foreground rounded-tl-none"
                }`}>
                  
                  {/* PREVIEW SECTION (Above text) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="p-1 space-y-1 bg-black/5">
                      {msg.attachments.map((file, i) => {
                        const isImage = file.type.startsWith('image/');
                        const isCode = file.name.match(/\.(ts|js|py|java|cpp|rs|go|html|css)$/);

                        return (
                          <div 
                            key={i} 
                            onClick={() => onAttachmentClick?.(file)}
                            className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-all bg-black/20"
                          >
                            {isImage ? (
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="max-h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="flex items-center gap-3 p-4 min-w-[200px]">
                                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                  {isCode ? <Code size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold truncate">{file.name}</div>
                                  <div className="text-[9px] opacity-60 uppercase">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MESSAGE TEXT */}
                  {msg.content && (
                    <div className="px-4 py-3 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
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