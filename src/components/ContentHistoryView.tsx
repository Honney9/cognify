import { Code, FileText, Camera, Image, Lock, Clock, Search } from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  Code,
  Documents: FileText,
  Screenshots: Camera,
  Photos: Image,
  "Secure Vault": Lock,
};

const mockHistory: Record<string, { name: string; date: string; size: string }[]> = {
  Code: [
    { name: "auth-service.ts", date: "Mar 4, 2026", size: "12 KB" },
    { name: "api-handler.py", date: "Mar 3, 2026", size: "8 KB" },
    { name: "utils.js", date: "Mar 1, 2026", size: "3 KB" },
  ],
  Documents: [
    { name: "Q1-Report.pdf", date: "Mar 4, 2026", size: "2.4 MB" },
    { name: "Contract-Draft.docx", date: "Mar 2, 2026", size: "890 KB" },
  ],
  Screenshots: [
    { name: "dashboard-screenshot.png", date: "Mar 5, 2026", size: "1.2 MB" },
    { name: "error-log-capture.png", date: "Mar 3, 2026", size: "540 KB" },
  ],
  Photos: [
    { name: "team-photo.jpg", date: "Mar 4, 2026", size: "3.1 MB" },
    { name: "office-event.jpg", date: "Mar 1, 2026", size: "2.8 MB" },
  ],
  "Secure Vault": [
    { name: "credentials.enc", date: "Mar 5, 2026", size: "1 KB" },
    { name: "keys-backup.enc", date: "Feb 28, 2026", size: "4 KB" },
  ],
};

interface ContentHistoryViewProps {
  folder: string;
}

export default function ContentHistoryView({ folder }: ContentHistoryViewProps) {
  const [search, setSearch] = useState("");
  const Icon = iconMap[folder] || FileText;
  const items = mockHistory[folder] || [];
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {folder}
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${folder.toLowerCase()}...`}
          className="w-full bg-[hsl(var(--prompt-bg))] border border-[hsl(var(--prompt-border))] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No items found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} />
                    {item.date}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{item.size}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
