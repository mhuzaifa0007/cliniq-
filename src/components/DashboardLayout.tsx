import { useState } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, FileText, LogOut,
  Menu, X, Activity, UserCog, ClipboardList, ChevronRight, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Doctors", icon: UserCog, path: "/doctors" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
    { label: "Subscription", icon: CreditCard, path: "/subscription" },
  ],
  doctor: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  ],
  receptionist: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
  ],
  patient: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
  patient: "Patient",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gradient-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-primary-foreground">Hamza Clinic</h1>
            <p className="text-[10px] text-sidebar-muted">Hackathon Edition</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { setSidebarOpen(false); setTimeout(() => navigate(item.path), 10); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
              <p className="text-xs text-sidebar-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={() => { logout(); navigate("/"); }} className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6 shadow-card">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {navItems.find(n => n.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          Developed by <span className="font-semibold text-primary">Muhammad Huzaifa</span> • Hamza Clinic
        </footer>
      </div>
    </div>
  );
}
