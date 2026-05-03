import Shell from "@/components/layout/Shell";
import { Database, Key, Bell, Palette, Globe, Shield } from "lucide-react";

const SECTIONS = [
  {
    id: "general",
    icon: Globe,
    label: "General",
    description: "App name, timezone, and default behaviour",
    fields: [
      { label: "App Name", type: "text", value: "dbSherpa Studio", placeholder: "dbSherpa Studio" },
      { label: "Timezone", type: "select", value: "UTC", options: ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"] },
    ],
  },
  {
    id: "database",
    icon: Database,
    label: "Database",
    description: "Connection strings and query defaults",
    fields: [
      { label: "Default DB Connection", type: "text", value: "", placeholder: "postgresql://user:pass@host:5432/db" },
      { label: "Query Timeout (ms)", type: "text", value: "30000", placeholder: "30000" },
    ],
  },
  {
    id: "api-keys",
    icon: Key,
    label: "API Keys",
    description: "Manage credentials for external integrations",
    fields: [
      { label: "OpenAI API Key", type: "password", value: "", placeholder: "sk-..." },
      { label: "Anthropic API Key", type: "password", value: "", placeholder: "sk-ant-..." },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    description: "Alert channels for workflow events",
    fields: [
      { label: "Slack Webhook URL", type: "text", value: "", placeholder: "https://hooks.slack.com/..." },
      { label: "Email on Failure", type: "text", value: "", placeholder: "alerts@yourorg.com" },
    ],
  },
];

export default function Settings() {
  return (
    <Shell>
      <div className="p-8 max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your dbSherpa Studio workspace</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.description}</div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.label} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          defaultValue={field.value}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          defaultValue={field.value}
                          placeholder={field.placeholder}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-4 flex justify-end">
                  <button className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-4 py-2 rounded-lg transition-colors font-mono">
                    Save {section.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
