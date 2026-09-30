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

function getProviderConfig() {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("AI service is not configured.");
  }

  return { apiKey, apiUrl, model };
}

async function callModel(system, user) {
  const { apiKey, apiUrl, model } = getProviderConfig();

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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed." }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (JSON.stringify(body).length > MAX_BODY_SIZE) {
      return {
        statusCode: 413,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request is too large." }),
      };
    }

    const action =
      event.pathParameters?.splat ||
      event.queryStringParameters?.action ||
      "";

    const builder = prompts[action];

    if (!builder) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unknown AI endpoint." }),
      };
    }

    const { system, user } = builder(body);
    const response = await callModel(system, user);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    console.error("AI endpoint error:", error.message);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "AI service is temporarily unavailable." }),
    };
  }
};
