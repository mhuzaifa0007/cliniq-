import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function useAppointmentTrends() {
  return useQuery({
    queryKey: ["appointment-trends"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("date, status")
        .order("date", { ascending: true });

      if (!data || data.length === 0) return { monthly: [], statusDist: [] };

      // Group by month
      const monthMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};

      data.forEach((a) => {
        const month = a.date.substring(0, 7); // YYYY-MM
        monthMap[month] = (monthMap[month] || 0) + 1;
        statusMap[a.status] = (statusMap[a.status] || 0) + 1;
      });

      const monthly = Object.entries(monthMap)
        .slice(-6)
        .map(([month, count]) => ({
          month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
          appointments: count,
        }));

      const statusDist = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      return { monthly, statusDist };
    },
  });
}

function usePatientGrowth() {
  return useQuery({
    queryKey: ["patient-growth"],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (!data || data.length === 0) return [];

      const monthMap: Record<string, number> = {};
      data.forEach((p) => {
        const month = p.created_at.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      // Cumulative
      let total = 0;
      return Object.entries(monthMap).slice(-6).map(([month, count]) => {
        total += count;
        return {
          month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
          patients: total,
          new: count,
        };
      });
    },
  });
}

const PIE_COLORS = [
  "hsl(174, 62%, 38%)", // primary
  "hsl(38, 92%, 50%)",  // warning
  "hsl(210, 80%, 52%)", // info
  "hsl(0, 72%, 51%)",   // destructive
  "hsl(152, 60%, 40%)", // success
];

export default function DashboardCharts() {
  const { data: trends, isLoading: trendsLoading } = useAppointmentTrends();
  const { data: growth, isLoading: growthLoading } = usePatientGrowth();

  const isLoading = trendsLoading || growthLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="h-72 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-72 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  const hasData = (trends?.monthly?.length || 0) > 0 || (growth?.length || 0) > 0;
  if (!hasData) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2 mb-6">
      {/* Appointment Trends */}
      {(trends?.monthly?.length || 0) > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Appointment Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends!.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(210, 10%, 46%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(210, 10%, 46%)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 18%, 89%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="appointments" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Patient Growth */}
      {(growth?.length || 0) > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Patient Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(210, 10%, 46%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(210, 10%, 46%)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 18%, 89%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="patients" stroke="hsl(174, 62%, 38%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(174, 62%, 38%)" }} />
              <Line type="monotone" dataKey="new" stroke="hsl(210, 80%, 52%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(210, 80%, 52%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status Distribution */}
      {(trends?.statusDist?.length || 0) > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={trends!.statusDist}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {trends!.statusDist.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
