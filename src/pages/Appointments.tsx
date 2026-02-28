import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Calendar, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  completed: "bg-info/10 text-info",
  cancelled: "bg-destructive/10 text-destructive",
};

function BookAppointmentModal({ open, onClose, isPatient }: { open: boolean; onClose: () => void; isPatient?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ patient_id: "", date: "", time: "", type: "General Checkup", notes: "" });
  const [doctorId, setDoctorId] = useState("");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, name").order("name");
      return data || [];
    },
    enabled: open && !isPatient,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_doctors");
      return data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.date) throw new Error("Date is required");
      if (!form.time) throw new Error("Time is required");
      if (!doctorId) throw new Error("Please select a doctor");
      if (new Date(form.date) < new Date(new Date().toDateString())) throw new Error("Cannot book in the past");

      let patientId = form.patient_id;

      if (isPatient) {
        if (!user?.id) throw new Error("You must be signed in");

        const { data: ownPatient, error: ownPatientError } = await supabase
          .from("patients")
          .select("id")
          .eq("created_by", user.id)
          .limit(1)
          .maybeSingle();

        if (ownPatientError) throw ownPatientError;

        if (ownPatient?.id) {
          patientId = ownPatient.id;
        } else {
          const { data: emailPatient, error: emailPatientError } = await supabase
            .from("patients")
            .select("id")
            .eq("email", user.email)
            .limit(1)
            .maybeSingle();

          if (emailPatientError) throw emailPatientError;

          if (emailPatient?.id) {
            patientId = emailPatient.id;
          } else {
            const { data: createdPatient, error: createPatientError } = await supabase
              .from("patients")
              .insert({
                name: user.name?.trim() || "Patient",
                age: 0,
                gender: "other",
                email: user.email || null,
                created_by: user.id,
              })
              .select("id")
              .single();

            if (createPatientError) throw createPatientError;
            patientId = createdPatient.id;
          }
        }
      }

      if (!patientId) throw new Error("Please select a patient");

      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        date: form.date,
        time: form.time,
        type: form.type,
        notes: form.notes.trim() || null,
        status: "pending",
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["recent-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Appointment booked");
      onClose();
      setForm({ patient_id: "", date: "", time: "", type: "General Checkup", notes: "" });
      setDoctorId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-card-hover animate-fade-in mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">Book Appointment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          {!isPatient && (
            <div>
              <label className="text-sm font-medium text-foreground">Patient *</label>
              <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground">Doctor *</label>
            <select required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
              <option value="">Select doctor</option>
              {doctors.map((d: any) => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Date *</label>
              <input required type="date" min={new Date().toISOString().split("T")[0]} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Time *</label>
              <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
              {["General Checkup", "Follow-up", "Consultation", "Lab Results Review", "Emergency"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea value={form.notes} maxLength={500} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Optional notes..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
              {mutation.isPending ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showBook, setShowBook] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*, patients(name)").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const canEdit = user?.role !== "patient";
  const filtered = appointments
    .filter((a: any) => filter === "all" || a.status === filter)
    .filter((a: any) => (a.patients?.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted-foreground">{appointments.length} total</p>
        </div>
        {/* All roles can book (patients can self-book) */}
        <button onClick={() => setShowBook(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient..."
            className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${filter === s ? "gradient-primary text-primary-foreground" : "border border-border bg-card text-card-foreground hover:bg-muted"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card animate-fade-in overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  {canEdit && <th className="px-5 py-3 text-left font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No appointments found</td></tr>
                ) : filtered.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-card-foreground">{apt.patients?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{apt.date}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{apt.time}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{apt.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[apt.status]}`}>{apt.status}</span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3.5">
                        <select value={apt.status} onChange={(e) => updateStatus.mutate({ id: apt.id, status: e.target.value })}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BookAppointmentModal open={showBook} onClose={() => setShowBook(false)} isPatient={user?.role === "patient"} />
    </div>
  );
}
