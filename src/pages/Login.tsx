import { useState } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, ArrowRight, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
      const result = await signup(email, password, name, role);
      setLoading(false);
      if (result.success) {
        toast.success("Account created! Please check your email to verify, then sign in.");
        setIsSignup(false);
      } else {
        setError(result.error || "Signup failed");
      }
    } else {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Invalid credentials");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${100 + i * 80}px`, 
                height: `${100 + i * 80}px`,
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)",
                animation: `pulse ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          {/* Logo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-3xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
            CliniQ<span className="text-white/70">+</span>
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed max-w-md mb-10">
            Pakistan's most advanced AI-powered clinic management platform. 
            Streamline your practice with smart diagnostics & digital prescriptions.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-10">
            {[
              { value: "500+", label: "Patients", icon: "👥" },
              { value: "1,200+", label: "Appointments", icon: "📅" },
              { value: "98%", label: "Satisfaction", icon: "⭐" }
            ].map((stat, i) => (
              <div 
                key={stat.label}
                className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3">
            {["AI Diagnostics", "Digital Prescriptions", "Smart Scheduling"].map((feature) => (
              <span 
                key={feature}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white/90 border border-white/20"
              >
                <Sparkles className="h-3 w-3" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CliniQ+
              </span>
              <p className="text-xs text-muted-foreground">Smart Clinic Management</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              {isSignup ? "Create Account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignup 
                ? "Join thousands of healthcare professionals" 
                : "Sign in to your dashboard to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <input
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Role</label>
                  <select
                    value={role} 
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 pr-12 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit" 
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignup ? "Creating..." : "Signing in..."}
                </span>
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(""); }} 
              className="font-semibold text-primary hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              Crafted with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by <span className="font-semibold text-foreground">Huzaifa</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
