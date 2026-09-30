function averageCycleLength(cycles) {
  if (cycles.length < 2) return null;
  const dates = cycles
    .map((cycle) => new Date(cycle.objectData.PeriodStartDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  if (dates.length < 2) return null;
  const gaps = [];
  for (let index = 1; index < dates.length; index += 1) {
    gaps.push(Math.round((dates[index] - dates[index - 1]) / 86400000));
  }
  return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
}

function localHealthResponse(question, context = {}) {
  const text = question.toLowerCase();

  if (text.includes('cramp') || text.includes('period pain')) {
    return ['**Period cramps**', '', 'Menstrual cramps are commonly caused by contractions of the uterus. Mild cramps can often be managed with rest, heat, hydration, and suitable over-the-counter pain relief when appropriate.', '', 'Seek medical care when pain is severe, suddenly different, persistent, or affecting daily activities.'].join('\n');
  }

  if (text.includes('cycle') || text.includes('period')) {
    const hasCycle = Boolean(context.healthProfile?.lastCycle);
    return ['**Menstrual cycle basics**', '', 'Cycle length can vary between people and from month to month. Tracking start dates, flow, and symptoms over several cycles can help you understand your own pattern.', '', hasCycle ? 'Your saved profile contains recent cycle information that can be used for simple tracking.' : 'Add a few cycle entries to make the tracker more useful.'].join('\n');
  }

  if (text.includes('medicine') || text.includes('medication')) {
    return ['**Medication information**', '', 'Keep the medicine name, dose, timing, and reason for use recorded clearly. Take medicines only as directed by a qualified healthcare professional or the official label.', '', 'For possible side effects, interactions, or dosage changes, check with a pharmacist or clinician.'].join('\n');
  }

  if (text.includes('nutrition') || text.includes('diet') || text.includes('food')) {
    return ['**Nutrition basics**', '', 'A balanced diet usually includes vegetables and fruit, protein sources, whole grains, healthy fats, and enough fluids. Individual needs depend on age, activity, and health conditions.', '', 'For a medical condition or a therapeutic diet, use advice from a qualified professional.'].join('\n');
  }

  return ['**General health information**', '', 'Your question was: "' + question + '"', '', 'This local version of MedVault provides simple educational guidance and does not connect to an external medical AI service.', '', 'For symptoms that are severe, urgent, or worrying, contact a healthcare professional.'].join('\n');
}

export async function getHealthAssistance(question, userHealthData) {
  return localHealthResponse(question, userHealthData);
}

export async function getEnhancedHealthAssistance(question, userHealthContext) {
  return localHealthResponse(question, userHealthContext);
}

export async function getEnhancedHealthAssistanceWithSearch(question, userHealthContext) {
  return localHealthResponse(question, userHealthContext);
}

export async function generateCycleInsights(cycleData) {
  const average = averageCycleLength(cycleData);
  return JSON.stringify({
    nextPeriodDate: null,
    nextPeriodConfidence: average ? 'low' : 'very-low',
    averageCycleLength: average,
    cycleRegularity: average ? 'estimated from saved entries' : 'not enough data',
    fertilityWindow: 'not calculated in local mode',
    insights: average ? ['Keep recording cycle start dates for a clearer personal pattern.'] : ['Add at least two cycle entries for a simple average estimate.'],
    recommendations: ['Use the tracker consistently.', 'Discuss unusual or concerning changes with a healthcare professional.'],
  });
}

export async function generateDocumentSummary(documentText, category) {
  if (!documentText?.trim()) {
    return 'No document text was provided for the ' + (category || 'health') + ' record. Automatic document analysis is disabled in local mode.';
  }
  return 'Local note for ' + (category || 'health') + ': the document text is available to the app, but automatic medical summarisation is disabled in this simple version.';
}
