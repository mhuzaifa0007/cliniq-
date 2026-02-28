import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "symptom-check") {
      systemPrompt = `You are an AI medical assistant for a clinic management system. You help doctors by analyzing symptoms and providing possible conditions. You are NOT making a diagnosis - you are providing decision support.
Always respond in this exact JSON format using the suggest_conditions tool.`;
      
      userPrompt = `Patient Info:
- Age: ${data.age}
- Gender: ${data.gender}
- Symptoms: ${data.symptoms}
- Medical History: ${data.history || "None provided"}

Analyze these symptoms and provide possible conditions, risk level, and suggested tests.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "suggest_conditions",
              description: "Return possible medical conditions based on symptoms",
              parameters: {
                type: "object",
                properties: {
                  conditions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Condition name" },
                        probability: { type: "string", enum: ["High", "Medium", "Low"] },
                        description: { type: "string", description: "Brief description" },
                      },
                      required: ["name", "probability", "description"],
                      additionalProperties: false,
                    },
                  },
                  risk_level: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
                  suggested_tests: {
                    type: "array",
                    items: { type: "string" },
                  },
                  recommendations: { type: "string" },
                },
                required: ["conditions", "risk_level", "suggested_tests", "recommendations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "suggest_conditions" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No tool call response");

    } else if (action === "prescription-explain") {
      systemPrompt = `You are a friendly medical AI assistant. Explain prescriptions in simple, patient-friendly language. Include lifestyle recommendations and preventive advice. Keep it concise and reassuring.`;
      
      userPrompt = `Explain this prescription to the patient in simple terms:
- Diagnosis: ${data.diagnosis}
- Medicines: ${JSON.stringify(data.medicines)}
- Instructions: ${data.instructions || "None"}

Provide:
1. Simple explanation of the condition
2. Why each medicine was prescribed
3. Lifestyle recommendations
4. Preventive advice`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const result = await response.json();
      const explanation = result.choices?.[0]?.message?.content || "Unable to generate explanation.";
      return new Response(JSON.stringify({ explanation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "risk-flag") {
      systemPrompt = `You are a medical risk analysis AI. Analyze patient history for risk patterns. Be concise and factual.`;
      
      userPrompt = `Analyze this patient's medical history for risk patterns:
- Diagnoses: ${JSON.stringify(data.diagnoses)}
- Symptoms history: ${JSON.stringify(data.symptoms)}
- Appointments: ${data.appointmentCount} total

Flag any:
1. Repeated infection patterns
2. Chronic symptoms
3. High-risk combinations
4. Recommendations`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "flag_risks",
              description: "Return risk analysis for the patient",
              parameters: {
                type: "object",
                properties: {
                  overall_risk: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
                  flags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["Low", "Medium", "High"] },
                      },
                      required: ["type", "description", "severity"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: { type: "string" },
                },
                required: ["overall_risk", "flags", "recommendations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "flag_risks" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(JSON.stringify({ error: "AI service unavailable." }), {
            status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No tool call response");

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("AI function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
