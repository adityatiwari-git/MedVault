// Server-side AI service boundary.
// Provider credentials must never be exposed to the browser.

const MAX_BODY_SIZE = 12000;

async function requestAI(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.error || 'AI service request failed.');
  }

  return data.response ?? '';
}

export async function generateDocumentSummary(documentText, category) {
  return requestAI('/api/ai/document-summary', { documentText, category });
}

export async function generateCycleInsights(cycleData) {
  return requestAI('/api/ai/cycle-insights', { cycleData });
}

export async function getHealthAssistance(question, userHealthData) {
  return requestAI('/api/ai/health-assistance', { question, userHealthData });
}

export async function getEnhancedHealthAssistance(question, userHealthContext) {
  return requestAI('/api/ai/enhanced-health-assistance', {
    question,
    userHealthContext,
  });
}

export async function getEnhancedHealthAssistanceWithSearch(question, userHealthContext) {
  return requestAI('/api/ai/enhanced-health-assistance-search', {
    question,
    userHealthContext,
  });
}
