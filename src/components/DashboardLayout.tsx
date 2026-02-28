import { useState } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, FileText, LogOut,
  Menu, X, Activity, UserCog, CreditCard, Heart
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
  const currentPage = navItems.find(n => n.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Modern Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white/80 backdrop-blur-xl border-r border-border/50 shadow-2xl transition-all duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="relative px-6 py-6 border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                <Activity className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CliniQ+
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Smart Clinic</p>
            </div>
          </div>
          <button 
            className="absolute right-4 top-6 lg:hidden p-1 rounded-lg hover:bg-muted transition-colors" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { 
                    setSidebarOpen(false); 
                    setTimeout(() => navigate(item.path), 10); 
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active ? "text-white" : "group-hover:scale-110"
                  )} />
                  {item.label}
                  {active && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-border/30 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-white font-semibold shadow-md">
                {user.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
              <button 
                onClick={() => { logout(); navigate("/"); }} 
                className="rounded-xl p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by <span className="font-semibold text-foreground">Huzaifa</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-20 items-center justify-between border-b border-border/30 bg-white/50 backdrop-blur-xl px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2.5 rounded-xl hover:bg-muted transition-colors" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {currentPage}
              </h2>
              <p className="text-xs text-muted-foreground">
                Welcome back, {user.name.split(" ")[0]} 👋
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
