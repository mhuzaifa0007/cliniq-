import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Download, Plus, Pill, X, Trash2, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import PrescriptionExplainer from "@/components/PrescriptionExplainer";

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
}

function AddPrescriptionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ patient_id: "", diagnosis: "", instructions: "" });
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", dosage: "", duration: "" }]);
  const [symptomInput, setSymptomInput] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, name, age, gender").order("name");
      return data || [];
    },
    enabled: open,
  });

  const selectedPatient = patients.find((p: any) => p.id === form.patient_id);

  const aiDiagnosis = useMutation({
    mutationFn: async () => {
      if (!symptomInput.trim()) throw new Error("Enter symptoms first");
      const { data, error } = await supabase.functions.invoke("ai-clinic", {
        body: {
          action: "symptom-check",
          data: {
            symptoms: symptomInput,
            age: selectedPatient?.age || "Unknown",
            gender: selectedPatient?.gender || "Unknown",
            history: "",
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      if (data.conditions?.length > 0) {
        const topCondition = data.conditions[0];
        setForm((f) => ({
          ...f,
          diagnosis: topCondition.name,
          instructions: f.instructions || data.recommendations || "",
        }));
        toast.success(`AI suggests: ${topCondition.name} (${topCondition.probability} probability)`);
      }
    },
    onError: (err: any) => toast.error(err.message || "AI analysis failed"),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.patient_id) throw new Error("Please select a patient");
      if (!form.diagnosis.trim()) throw new Error("Diagnosis is required");
      const validMeds = medicines.filter(m => m.name.trim());
      if (validMeds.length === 0) throw new Error("Add at least one medicine");

      const { error } = await supabase.from("prescriptions").insert({
        patient_id: form.patient_id,
        doctor_id: user?.id!,
        diagnosis: form.diagnosis.trim(),
        medicines: validMeds as any,
        instructions: form.instructions.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription created");
      onClose();
      setForm({ patient_id: "", diagnosis: "", instructions: "" });
      setMedicines([{ name: "", dosage: "", duration: "" }]);
      setSymptomInput("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-card-hover animate-fade-in mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">New Prescription</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Patient *</label>
            <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
              <option value="">Select patient</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* AI Diagnosis Helper */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <label className="text-sm font-medium text-primary flex items-center gap-1.5">
              <Brain className="h-4 w-4" /> AI Diagnosis (Optional)
            </label>
            <p className="text-xs text-muted-foreground">Enter symptoms and let AI suggest a diagnosis, or type manually below.</p>
            <div className="flex gap-2">
              <input value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="e.g. fever, cough, headache for 3 days"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              <button type="button" onClick={() => aiDiagnosis.mutate()} disabled={aiDiagnosis.isPending}
                className="rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                {aiDiagnosis.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                Analyze
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Diagnosis *</label>
            <input required maxLength={255} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Enter diagnosis manually or use AI above"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> Medicines</label>
              <button type="button" onClick={() => setMedicines([...medicines, { name: "", dosage: "", duration: "" }])}
                className="text-xs text-primary font-medium hover:underline">+ Add Medicine</button>
            </div>
            {medicines.map((med, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Medicine" maxLength={100} value={med.name}
                  onChange={(e) => { const m = [...medicines]; m[i].name = e.target.value; setMedicines(m); }}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                <input placeholder="Dosage" maxLength={50} value={med.dosage}
                  onChange={(e) => { const m = [...medicines]; m[i].dosage = e.target.value; setMedicines(m); }}
                  className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                <input placeholder="Duration" maxLength={50} value={med.duration}
                  onChange={(e) => { const m = [...medicines]; m[i].duration = e.target.value; setMedicines(m); }}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                {medicines.length > 1 && (
                  <button type="button" onClick={() => setMedicines(medicines.filter((_, j) => j !== i))}
                    className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Instructions / Notes</label>
            <textarea value={form.instructions} maxLength={1000} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
              {mutation.isPending ? "Creating..." : "Create Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function generatePDF(rx: any) {
  const meds = (rx.medicines as Medicine[]) || [];
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Hamza Clinic Hackathon", 15, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Clinic Management System", 15, 26);

  // PRESCRIPTION title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIPTION", 15, 50);

  // Line
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(15, 54, pageWidth - 15, 54);

  // Patient info
  let y = 65;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Patient:", 15, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(rx.patients?.name || "—", 55, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Date:", 15, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(new Date(rx.created_at).toLocaleDateString("en-PK"), 55, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Diagnosis:", 15, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(rx.diagnosis, 55, y);

  // Medicines table
  y += 15;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("Medicines", 15, y);
  y += 8;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, pageWidth - 30, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("#", 18, y + 1);
  doc.text("Medicine", 28, y + 1);
  doc.text("Dosage", 100, y + 1);
  doc.text("Duration", 145, y + 1);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  meds.forEach((med, i) => {
    doc.text(`${i + 1}`, 18, y);
    doc.text(med.name, 28, y);
    doc.text(med.dosage || "—", 100, y);
    doc.text(med.duration || "—", 145, y);
    y += 8;
  });

  // Instructions
  if (rx.instructions) {
    y += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("Instructions", 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(rx.instructions, pageWidth - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5;
  }

  // Footer
  y += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Generated by Hamza Clinic — Developed by Muhammad Huzaifa", 15, y);
  doc.text("This prescription is digitally generated. Please consult your doctor for any concerns.", 15, y + 5);

  doc.save(`prescription-${rx.patients?.name || "patient"}-${rx.created_at.split("T")[0]}.pdf`);
  toast.success("Prescription PDF downloaded!");
}

export default function Prescriptions() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const canCreate = user?.role === "admin" || user?.role === "doctor";

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prescriptions").select("*, patients(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">{prescriptions.length} prescriptions issued</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> New Prescription
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No prescriptions yet</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {prescriptions.map((rx: any) => {
            const meds = (rx.medicines as Medicine[]) || [];
            return (
              <div key={rx.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{rx.patients?.name || "—"}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(rx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => generatePDF(rx)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Download PDF">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Diagnosis</p>
                  <p className="text-sm font-medium text-card-foreground">{rx.diagnosis}</p>
                </div>
                {meds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> Medicines</p>
                    {meds.map((med, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span className="text-sm font-medium text-card-foreground">{med.name}</span>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">{med.dosage}</span>
                          {med.duration && <span className="ml-2 text-xs text-accent-foreground font-medium">{med.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {rx.instructions && (
                  <p className="mt-3 text-xs text-muted-foreground italic border-t border-border pt-3">📝 {rx.instructions}</p>
                )}
                <PrescriptionExplainer diagnosis={rx.diagnosis} medicines={meds} instructions={rx.instructions} />
              </div>
            );
          })}
        </div>
      )}

      <AddPrescriptionModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
