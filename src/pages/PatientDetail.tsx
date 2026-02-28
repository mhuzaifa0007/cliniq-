import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, Droplets, MapPin, Calendar, FileText, Stethoscope, Clock } from "lucide-react";

function usePatientDetail(id: string) {
  return useQuery({
    queryKey: ["patient-detail", id],
    queryFn: async () => {
      const [patientRes, appointmentsRes, prescriptionsRes, diagnosesRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase.from("appointments").select("*").eq("patient_id", id).order("date", { ascending: false }),
        supabase.from("prescriptions").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("diagnosis_logs").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
      ]);
      if (patientRes.error) throw patientRes.error;
      return {
        patient: patientRes.data,
        appointments: appointmentsRes.data || [],
        prescriptions: prescriptionsRes.data || [],
        diagnoses: diagnosesRes.data || [],
      };
    },
    enabled: !!id,
  });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  completed: "bg-info/10 text-info",
  cancelled: "bg-destructive/10 text-destructive",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

type TimelineItem = {
  id: string;
  type: "appointment" | "prescription" | "diagnosis";
  date: string;
  data: any;
};

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePatientDetail(id || "");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-lg bg-card animate-pulse" />
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const { patient, appointments, prescriptions, diagnoses } = data;

  // Build unified timeline
  const timeline: TimelineItem[] = [
    ...appointments.map((a: any) => ({ id: a.id, type: "appointment" as const, date: a.date, data: a })),
    ...prescriptions.map((p: any) => ({ id: p.id, type: "prescription" as const, date: p.created_at.split("T")[0], data: p })),
    ...diagnoses.map((d: any) => ({ id: d.id, type: "diagnosis" as const, date: d.created_at.split("T")[0], data: d })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const iconMap = {
    appointment: Calendar,
    prescription: FileText,
    diagnosis: Stethoscope,
  };
  const colorMap = {
    appointment: "bg-info/10 text-info",
    prescription: "bg-success/10 text-success",
    diagnosis: "bg-warning/10 text-warning",
  };
  const labelMap = {
    appointment: "Appointment",
    prescription: "Prescription",
    diagnosis: "Diagnosis",
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate("/patients")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Patients
      </button>

      {/* Patient info card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-xl">
            {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-card-foreground">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">{patient.age} years • {patient.gender}</p>
          </div>
          {patient.blood_group && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              <Droplets className="h-4 w-4" /> {patient.blood_group}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          {patient.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {patient.phone}</div>}
          {patient.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {patient.email}</div>}
          {patient.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {patient.address}</div>}
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-info/10 p-3 text-center">
            <p className="text-xl font-bold text-info">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">Appointments</p>
          </div>
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-xl font-bold text-success">{prescriptions.length}</p>
            <p className="text-xs text-muted-foreground">Prescriptions</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-3 text-center">
            <p className="text-xl font-bold text-warning">{diagnoses.length}</p>
            <p className="text-xs text-muted-foreground">Diagnoses</p>
          </div>
        </div>
      </div>

      {/* Medical History Timeline */}
      <div className="rounded-xl border border-border bg-card shadow-card animate-fade-in">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-card-foreground">Medical History</h2>
        </div>

        {timeline.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No medical history yet</div>
        ) : (
          <div className="p-5">
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

              {timeline.map((item, idx) => {
                const Icon = iconMap[item.type];
                return (
                  <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Icon circle */}
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorMap[item.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-lg border border-border bg-background p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[item.type]}`}>
                          {labelMap[item.type]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {item.date}
                        </span>
                      </div>

                      {item.type === "appointment" && (
                        <div className="text-sm space-y-1">
                          <p className="text-card-foreground font-medium">{item.data.type}</p>
                          <p className="text-muted-foreground">Time: {item.data.time}</p>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.data.status] || ""}`}>
                            {item.data.status}
                          </span>
                          {item.data.notes && <p className="text-muted-foreground text-xs mt-1">{item.data.notes}</p>}
                        </div>
                      )}

                      {item.type === "prescription" && (
                        <div className="text-sm space-y-1">
                          <p className="text-card-foreground font-medium">Diagnosis: {item.data.diagnosis}</p>
                          {item.data.instructions && <p className="text-muted-foreground text-xs">{item.data.instructions}</p>}
                          {Array.isArray(item.data.medicines) && item.data.medicines.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(item.data.medicines as any[]).map((m: any, i: number) => (
                                <span key={i} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  {m.name || m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === "diagnosis" && (
                        <div className="text-sm space-y-1">
                          <p className="text-card-foreground font-medium">Symptoms: {item.data.symptoms}</p>
                          {item.data.diagnosis && <p className="text-muted-foreground">Diagnosis: {item.data.diagnosis}</p>}
                          {item.data.risk_level && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RISK_STYLES[item.data.risk_level] || ""}`}>
                              Risk: {item.data.risk_level}
                            </span>
                          )}
                          {item.data.notes && <p className="text-muted-foreground text-xs mt-1">{item.data.notes}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
