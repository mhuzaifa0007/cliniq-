import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Mail, Star } from "lucide-react";

export default function Doctors() {
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_doctors");
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
        <p className="text-sm text-muted-foreground">{doctors.length} active doctors</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No doctors registered yet. Sign up as a doctor to appear here.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc: any) => (
            <div key={doc.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold text-sm">
                  {doc.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground">{doc.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> Doctor
                  </p>
                </div>
              </div>
              {doc.phone && (
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {doc.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
