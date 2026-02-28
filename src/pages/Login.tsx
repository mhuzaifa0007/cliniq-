import { useState } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, ArrowRight } from "lucide-react";
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
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-primary-foreground/20"
              style={{
                width: `${200 + i * 120}px`, height: `${200 + i * 120}px`,
                top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
            <Activity className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">CliniQ+</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Pakistan's leading smart clinic management platform. AI-powered diagnosis, digital prescriptions, and complete patient care — built for modern healthcare.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[["500+", "Patients"], ["1,200+", "Appointments"], ["98%", "Satisfaction"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-bold text-white">{val}</p>
                <p className="text-xs text-white/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CliniQ+</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">{isSignup ? "Create Account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? "Sign up to get started" : "Sign in to your account to continue"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1.5 w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
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
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1.5 w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 pr-10 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Create Account" : "Sign In")}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="font-medium text-primary hover:underline">
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <span className="text-primary/60">Powered by</span> <span className="font-semibold text-primary">Huzaifa</span>
          </p>
        </div>
      </div>
    </div>
  );
}
