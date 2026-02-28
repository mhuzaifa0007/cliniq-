import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Phone, Mail, Droplets, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import SmartSymptomChecker from "@/components/SmartSymptomChecker";

function PatientFormModal({ open, onClose, patient }: { open: boolean; onClose: () => void; patient?: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!patient;
  const [form, setForm] = useState({
    name: patient?.name || "",
    age: patient?.age?.toString() || "",
    gender: patient?.gender || "Male",
    phone: patient?.phone || "",
    email: patient?.email || "",
    blood_group: patient?.blood_group || "",
    address: patient?.address || "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.age || !form.gender) throw new Error("Name, age, and gender are required");
      const age = parseInt(form.age);
      if (isNaN(age) || age < 0 || age > 150) throw new Error("Age must be between 0 and 150");
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) throw new Error("Invalid email format");
      if (form.phone && !/^[\d\s+\-()]{7,20}$/.test(form.phone)) throw new Error("Invalid phone format");

      const payload = {
        name: form.name.trim(),
        age,
        gender: form.gender,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        blood_group: form.blood_group || null,
        address: form.address.trim() || null,
      };

      if (isEdit) {
        const { error } = await supabase.from("patients").update(payload).eq("id", patient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("patients").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(isEdit ? "Patient updated" : "Patient added");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-card-hover animate-fade-in mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">{isEdit ? "Edit Patient" : "Add New Patient"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Age *</label>
              <input required type="number" min={0} max={150} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Gender *</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input value={form.phone} maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Address</label>
            <input maxLength={255} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
              {mutation.isPending ? "Saving..." : isEdit ? "Update Patient" : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<false | "add" | any>(false);
  const canEdit = user?.role === "admin" || user?.role === "doctor" || user?.role === "receptionist";

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">{patients.length} registered patients</p>
        </div>
        <div className="flex gap-2">
          {(user?.role === "doctor" || user?.role === "admin") && <SmartSymptomChecker />}
          {canEdit && (
            <button onClick={() => setShowForm("add")} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" /> Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients..."
          className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {search ? "No patients match your search" : "No patients registered yet. Add your first patient!"}
            </div>
          ) : filtered.map((patient) => (
            <div key={patient.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all animate-fade-in cursor-pointer group"
              onClick={() => navigate(`/patients/${patient.id}`)}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-sm">
                  {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground truncate">{patient.name}</h3>
                  <p className="text-xs text-muted-foreground">{patient.age}y • {patient.gender}</p>
                </div>
                <div className="flex items-center gap-1">
                  {patient.blood_group && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground flex items-center gap-1">
                      <Droplets className="h-3 w-3" /> {patient.blood_group}
                    </span>
                  )}
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setShowForm(patient); }}
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                {patient.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {patient.phone}</div>}
                {patient.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {patient.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <PatientFormModal
        open={!!showForm}
        onClose={() => setShowForm(false)}
        patient={showForm !== "add" ? showForm : undefined}
      />
    </div>
  );
}
