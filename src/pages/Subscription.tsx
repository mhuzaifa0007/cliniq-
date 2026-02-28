import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Check, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free Plan",
    price: "$0",
    period: "/month",
    icon: Shield,
    features: ["Up to 10 patients", "Basic appointment booking", "Simple prescriptions", "No AI features"],
    color: "border-border",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$49",
    period: "/month",
    icon: Zap,
    features: ["Unlimited patients", "AI Symptom Checker", "AI Prescription Explainer", "AI Risk Flagging", "Advanced analytics", "PDF prescriptions", "Priority support"],
    color: "border-primary",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$149",
    period: "/month",
    icon: Crown,
    features: ["Everything in Pro", "Multi-clinic support", "Custom branding", "API access", "Dedicated account manager", "SLA guarantee"],
    color: "border-warning",
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentPlan = "free" } = useQuery({
    queryKey: ["user-plan"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("subscription_plan").eq("user_id", user?.id!).single();
      return data?.subscription_plan || "free";
    },
    enabled: !!user,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const { error } = await supabase.from("profiles").update({ subscription_plan: plan }).eq("user_id", user?.id!);
      if (error) throw error;
    },
    onSuccess: (_, plan) => {
      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      toast.success(`Switched to ${plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Enterprise"} plan (simulated)`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12 text-muted-foreground">Only admins can manage subscription plans.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your clinic's subscription (simulated billing)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          return (
            <div key={plan.id} className={`relative rounded-xl border-2 bg-card p-6 shadow-card transition-all hover:shadow-card-hover ${isActive ? "border-primary ring-2 ring-primary/20" : plan.color} ${plan.popular ? "md:-mt-2 md:mb-2" : ""}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <plan.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="w-full rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-center text-sm font-semibold text-primary">
                  Current Plan
                </div>
              ) : (
                <button onClick={() => upgradeMutation.mutate(plan.id)} disabled={upgradeMutation.isPending}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${plan.popular ? "gradient-primary text-primary-foreground hover:opacity-90" : "border border-border text-card-foreground hover:bg-muted"}`}>
                  {plan.id === "free" ? "Downgrade" : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs text-muted-foreground italic">
          💡 This is a simulated subscription system for demonstration purposes. No actual payments are processed.
          In production, this would integrate with a payment gateway like Stripe.
        </p>
      </div>
    </div>
  );
}
