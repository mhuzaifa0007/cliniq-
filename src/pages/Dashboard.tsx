import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import DashboardCharts from "@/components/DashboardCharts";
import { Users, Calendar, FileText, UserCog, Clock, CheckCircle, DollarSign, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useStats(userId?: string, role?: string) {
  return useQuery({
    queryKey: ["dashboard-stats", userId, role],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [patientsRes, appointmentsRes, prescriptionsRes, todayApptsRes, doctorsRes, diagnosisRes] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("*").eq("date", today),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "doctor"),
        supabase.from("prescriptions").select("diagnosis"),
      ]);

      // Doctor-specific queries
      let doctorAppts = { count: 0 };
      let doctorRx = { count: 0 };
      let doctorTodayData: any[] = [];
      if (role === "doctor" && userId) {
        const [da, dr, dt] = await Promise.all([
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", userId),
          supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("doctor_id", userId),
          supabase.from("appointments").select("*").eq("doctor_id", userId).eq("date", today),
        ]);
        doctorAppts = { count: da.count || 0 };
        doctorRx = { count: dr.count || 0 };
        doctorTodayData = dt.data || [];
      }

      // Most common diagnosis
      const diagnosisData = diagnosisRes.data || [];
      const diagCount: Record<string, number> = {};
      diagnosisData.forEach((d: any) => {
        if (d.diagnosis) diagCount[d.diagnosis] = (diagCount[d.diagnosis] || 0) + 1;
      });
      const topDiagnosis = Object.entries(diagCount).sort((a, b) => b[1] - a[1])[0];

      const todayAppts = todayApptsRes.data || [];

      return {
        totalPatients: patientsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
        totalPrescriptions: prescriptionsRes.count || 0,
        todayAppointments: todayAppts,
        totalDoctors: doctorsRes.count || 0,
        topDiagnosis: topDiagnosis ? topDiagnosis[0] : "N/A",
        simulatedRevenue: todayAppts.filter((a: any) => a.status === "completed").length * 50 +
          (appointmentsRes.count || 0) * 30,
        doctorAppointments: doctorAppts.count,
        doctorPrescriptions: doctorRx.count,
        doctorTodayAppts: doctorTodayData,
      };
    },
  });
}

function useRecentAppointments() {
  return useQuery({
    queryKey: ["recent-appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  completed: "bg-info/10 text-info",
  cancelled: "bg-destructive/10 text-destructive",
};

function RecentAppointmentsTable() {
  const { data: appointments, isLoading } = useRecentAppointments();

  if (isLoading) return <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card animate-fade-in">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-semibold text-card-foreground">Recent Appointments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 font-medium text-muted-foreground">Patient</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Time</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {(!appointments || appointments.length === 0) ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No appointments yet</td></tr>
            ) : (
              appointments.map((apt: any) => (
                <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-card-foreground">{apt.patients?.name || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{apt.date}</td>
                  <td className="px-5 py-3 text-muted-foreground">{apt.time}</td>
                  <td className="px-5 py-3 text-muted-foreground">{apt.type}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[apt.status] || ""}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useStats(user?.id, user?.role);

  if (!user) return null;

  const todayCount = stats?.todayAppointments.length || 0;
  const pendingCount = stats?.todayAppointments.filter((a: any) => a.status === "pending").length || 0;
  const completedCount = stats?.todayAppointments.filter((a: any) => a.status === "completed").length || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening today at the clinic.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {user.role === "admin" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard title="Total Patients" value={stats?.totalPatients || 0} icon={Users} iconClassName="bg-accent text-accent-foreground" />
              <StatCard title="Today's Appointments" value={todayCount} icon={Calendar} iconClassName="bg-info/10 text-info" />
              <StatCard title="Active Doctors" value={stats?.totalDoctors || 0} icon={UserCog} iconClassName="bg-warning/10 text-warning" />
              <StatCard title="Revenue (Sim.)" value={`$${stats?.simulatedRevenue?.toLocaleString() || 0}`} icon={DollarSign} iconClassName="bg-success/10 text-success" />
              <StatCard title="Prescriptions" value={stats?.totalPrescriptions || 0} icon={FileText} iconClassName="bg-info/10 text-info" />
              <StatCard title="Top Diagnosis" value={stats?.topDiagnosis || "N/A"} icon={Stethoscope} iconClassName="bg-warning/10 text-warning" />
              <StatCard title="Monthly Appts" value={stats?.totalAppointments || 0} icon={Calendar} iconClassName="bg-accent text-accent-foreground" />
              <StatCard title="Completed Today" value={completedCount} icon={CheckCircle} iconClassName="bg-success/10 text-success" />
            </div>
          )}

          {user.role === "doctor" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard title="Today's Appointments" value={stats?.doctorTodayAppts?.length || 0} icon={Calendar} iconClassName="bg-info/10 text-info" />
              <StatCard title="Total Appointments" value={stats?.doctorAppointments || 0} icon={Calendar} iconClassName="bg-accent text-accent-foreground" />
              <StatCard title="Prescriptions" value={stats?.doctorPrescriptions || 0} icon={FileText} iconClassName="bg-success/10 text-success" />
              <StatCard title="Completed Today" value={stats?.doctorTodayAppts?.filter((a: any) => a.status === "completed").length || 0} icon={CheckCircle} iconClassName="bg-success/10 text-success" />
            </div>
          )}

          {user.role === "receptionist" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <StatCard title="Today's Appointments" value={todayCount} icon={Calendar} iconClassName="bg-accent text-accent-foreground" />
              <StatCard title="Pending" value={pendingCount} icon={Clock} iconClassName="bg-warning/10 text-warning" />
              <StatCard title="Patients" value={stats?.totalPatients || 0} icon={Users} iconClassName="bg-info/10 text-info" />
            </div>
          )}

          {user.role === "patient" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <StatCard title="Total Appointments" value={stats?.totalAppointments || 0} icon={Calendar} iconClassName="bg-accent text-accent-foreground" />
              <StatCard title="Prescriptions" value={stats?.totalPrescriptions || 0} icon={FileText} iconClassName="bg-info/10 text-info" />
              <StatCard title="Pending" value={pendingCount} icon={Clock} iconClassName="bg-warning/10 text-warning" />
            </div>
          )}
        </>
      )}

      {(user.role === "admin" || user.role === "doctor") && <DashboardCharts />}

      <RecentAppointmentsTable />
    </div>
  );
}
