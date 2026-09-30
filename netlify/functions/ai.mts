const MAX_BODY_SIZE = 12000;

const prompts = {
  "document-summary": ({ documentText, category }) => ({
    system: "You are a health-record summarization assistant. Summarize provided medical document text accurately and neutrally. Do not diagnose. Highlight important dates, tests, medicines, measurements, and follow-up items. Say when information is unclear. Keep the result concise.",
    user: `Category: ${category || "General Health"}\n\nDocument text:\n${documentText || ""}`,
  }),
  "cycle-insights": ({ cycleData }) => ({
    system: "You are an educational menstrual-cycle information assistant. Analyze the supplied cycle history and return valid JSON only with keys nextPeriodDate, nextPeriodConfidence, averageCycleLength, cycleRegularity, fertilityWindow, insights, recommendations. Predictions are estimates, not medical diagnoses. Use low confidence when data is sparse or irregular.",
    user: `Cycle history:\n${JSON.stringify(cycleData || [], null, 2)}\n\nCurrent date: ${new Date().toISOString().slice(0, 10)}`,
  }),
  "health-assistance": ({ question, userHealthData }) => ({
    system: "You are MedVault's general health information assistant. Provide educational information, not diagnosis or individualized treatment. Do not invent medical facts. Encourage professional care for concerning, urgent, or emergency symptoms. Keep private health context relevant and do not expose it unnecessarily.",
    user: `Question: ${question || ""}\n\nRelevant health context:\n${JSON.stringify(userHealthData || {}, null, 2)}`,
  }),
  "enhanced-health-assistance": ({ question, userHealthContext }) => ({
    system: "You are MedVault's women's-health information assistant. Give careful, evidence-aware educational information. Do not diagnose, prescribe, or claim certainty from incomplete health data. Mention when a clinician should be consulted. Treat all supplied health context as private.",
    user: `Question: ${question || ""}\n\nPrivate health context:\n${JSON.stringify(userHealthContext || {}, null, 2)}`,
  }),
  "enhanced-health-assistance-search": ({ question, userHealthContext }) => ({
    system: "You are MedVault's women's-health information assistant. Give careful, evidence-aware educational information. No external web search is performed by this deployment; do not claim that you searched the web or cite sources you did not retrieve. Do not diagnose or prescribe. Mention when a clinician should be consulted.",
    user: `Question: ${question || ""}\n\nPrivate health context:\n${JSON.stringify(userHealthContext || {}, null, 2)}`,
  }),
};

async function getProviderConfig() {
  const apiKey = Netlify.env.get("AI_API_KEY");
  const apiUrl = Netlify.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
  const model = Netlify.env.get("AI_MODEL") || "gpt-4o-mini";
  const supabaseUrl = Netlify.env.get("SUPABASE_URL");
  const supabaseAnonKey = Netlify.env.get("SUPABASE_ANON_KEY");

  if (!apiKey) {
    throw new Error("AI service is not configured.");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Authentication service is not configured.");
  }

  return { apiKey, apiUrl, model, supabaseUrl, supabaseAnonKey };
}

async function authenticateRequest(req) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const { supabaseUrl, supabaseAnonKey } = await getProviderConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  return response.ok;
}

async function callModel(system, user) {
  const { apiKey, apiUrl, model } = await getProviderConfig();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return content;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const authenticated = await authenticateRequest(req);

    if (!authenticated) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();

    if (JSON.stringify(body).length > MAX_BODY_SIZE) {
      return Response.json({ error: "Request is too large." }, { status: 413 });
    }

    const pathname = new URL(req.url).pathname;
    const action = pathname.split("/").filter(Boolean).pop() || "";
    const builder = prompts[action];

    if (!builder) {
      return Response.json({ error: "Unknown AI endpoint." }, { status: 404 });
    }

    const { system, user } = builder(body);
    const response = await callModel(system, user);

    return Response.json({ response });
  } catch (error) {
    console.error("AI endpoint error:", error instanceof Error ? error.message : error);
    return Response.json(
      { error: "AI service is temporarily unavailable." },
      { status: 500 },
    );
  }
};

export const config = {
  path: "/api/ai/*",
};
