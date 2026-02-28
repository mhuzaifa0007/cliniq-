import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useMutation } from "@tanstack/react-query";
import { Brain, AlertTriangle, TestTube, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RISK_COLORS: Record<string, string> = {
  Low: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning",
  High: "bg-destructive/10 text-destructive",
  Critical: "bg-destructive/20 text-destructive",
};

interface SymptomResult {
  conditions: { name: string; probability: string; description: string }[];
  risk_level: string;
  suggested_tests: string[];
  recommendations: string;
}

export default function SmartSymptomChecker({ patientAge, patientGender }: { patientAge?: number; patientGender?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symptoms: "", history: "" });
  const [result, setResult] = useState<SymptomResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-clinic", {
        body: {
          action: "symptom-check",
          data: {
            symptoms: form.symptoms,
            age: patientAge || "Unknown",
            gender: patientGender || "Unknown",
            history: form.history,
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as SymptomResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (err: any) => toast.error(err.message || "AI analysis failed. System continues without AI."),
  });

  if (user?.role !== "doctor" && user?.role !== "admin") return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-all">
        <Brain className="h-4 w-4" /> AI Symptom Checker
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Smart Symptom Checker
        </h3>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {!result ? (
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Symptoms *</label>
            <textarea required value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              placeholder="Describe patient symptoms (e.g., persistent headache, fever 101°F for 3 days, fatigue)"
              rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Medical History</label>
            <input value={form.history} onChange={(e) => setForm({ ...form, history: e.target.value })}
              placeholder="Relevant history (e.g., diabetes, hypertension)"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <p className="text-xs text-muted-foreground italic">⚠️ AI assistance only — not a diagnosis. Doctor judgment is final.</p>
          <button type="submit" disabled={mutation.isPending} className="w-full rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Brain className="h-4 w-4" /> Analyze Symptoms</>}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Risk Level */}
          <div className={`rounded-lg p-3 flex items-center gap-2 ${RISK_COLORS[result.risk_level] || ""}`}>
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold text-sm">Risk Level: {result.risk_level}</span>
          </div>

          {/* Possible Conditions */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Possible Conditions</h4>
            <div className="space-y-2">
              {result.conditions.map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-card-foreground">{c.name}</span>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${c.probability === "High" ? "bg-destructive/10 text-destructive" : c.probability === "Medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                      {c.probability}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Tests */}
          {result.suggested_tests.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><TestTube className="h-4 w-4" /> Suggested Tests</h4>
              <div className="flex flex-wrap gap-2">
                {result.suggested_tests.map((t, i) => (
                  <span key={i} className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{result.recommendations}</p>
          </div>

          <button onClick={() => { setResult(null); setForm({ symptoms: "", history: "" }); }}
            className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
            New Analysis
          </button>
        </div>
      )}
    </div>
  );
}
