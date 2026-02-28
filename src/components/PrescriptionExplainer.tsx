import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  diagnosis: string;
  medicines: { name: string; dosage: string; duration: string }[];
  instructions?: string;
}

export default function PrescriptionExplainer({ diagnosis, medicines, instructions }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-clinic", {
        body: {
          action: "prescription-explain",
          data: { diagnosis, medicines, instructions },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.explanation as string;
    },
    onSuccess: (data) => setExplanation(data),
    onError: (err: any) => toast.error(err.message || "Could not generate explanation"),
  });

  if (explanation) {
    return (
      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">AI Explanation</span>
        </div>
        <p className="text-sm text-card-foreground whitespace-pre-line">{explanation}</p>
        <button onClick={() => setExplanation(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
      </div>
    );
  }

  return (
    <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors">
      {mutation.isPending ? <><Loader2 className="h-3 w-3 animate-spin" /> Explaining...</> : <><Sparkles className="h-3 w-3" /> Explain to Patient</>}
    </button>
  );
}
