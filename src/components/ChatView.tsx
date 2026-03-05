import { useState } from "react";
import { ArrowRight, Bot, User } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to Cognify! I'm your intelligent content management companion. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "Thanks for your message! This is a demo response." },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4">
      <h2
        className="text-xl font-bold text-center py-4 text-foreground shrink-0"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Chat Session
      </h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User size={16} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center gap-2 bg-[hsl(var(--prompt-bg))] border border-[hsl(var(--prompt-border))] rounded-2xl px-3 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground py-2"
          />
          <button
            onClick={handleSend}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
