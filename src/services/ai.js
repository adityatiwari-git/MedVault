import { supabase } from '../lib/supabase.js';

// Provider credentials stay on the server. The browser only sends the user's
// Supabase access token with each AI request.
async function requestAI(endpoint, payload) {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  let responseData = {};
  try {
    responseData = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(responseData.error || 'AI service request failed.');
  }

  return responseData.response ?? '';
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
