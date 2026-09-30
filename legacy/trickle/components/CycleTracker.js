function CycleTracker({ user }) {
  try {
    const [cycles, setCycles] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingCycle, setEditingCycle] = React.useState(null);
    const [predictions, setPredictions] = React.useState(null);
    const [isGeneratingPrediction, setIsGeneratingPrediction] = React.useState(false);
    const [cycleForm, setCycleForm] = React.useState({
      startDate: '',
      endDate: '',
      flowIntensity: 'Medium',
      symptoms: [],
      notes: ''
    });

    const symptomOptions = ['Cramps', 'Headache', 'Mood Changes', 'Bloating', 'Fatigue', 'Back Pain', 'Nausea'];
    const flowOptions = ['Light', 'Medium', 'Heavy'];

    React.useEffect(() => {
      loadCycles();
    }, [user]);

    const loadCycles = async () => {
      try {
        const userCycles = await getUserCycles(user.objectId);
        setCycles(userCycles);
        
        // Generate AI predictions if we have cycle data
        if (userCycles.length > 0) {
          await generateCyclePredictions(userCycles);
        }
      } catch (error) {
        console.error('Error loading cycles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const generateCyclePredictions = async (cycleData) => {
      setIsGeneratingPrediction(true);
      try {
        const cycleHistory = cycleData.slice(0, 6).map(c => ({
          startDate: c.objectData.PeriodStartDate,
          endDate: c.objectData.PeriodEndDate,
          flowIntensity: c.objectData.FlowIntensity,
          symptoms: c.objectData.Symptoms || []
        }));

        const systemPrompt = `You are an advanced menstrual cycle prediction AI. Analyze the user's cycle history and provide accurate predictions.

OUTPUT FORMAT (JSON only, no markdown):
{
  "nextPeriodDate": "YYYY-MM-DD",
  "nextPeriodConfidence": "high/medium/low",
  "averageCycleLength": number,
  "cycleRegularity": "regular/irregular",
  "fertilityWindow": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "ovulationDay": "YYYY-MM-DD"
  },
  "insights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}

CALCULATION RULES:
- Calculate average cycle length from period start to next period start
- Predict next period based on last period + average cycle length
- Ovulation typically occurs 14 days before next period
- Fertility window: 5 days before ovulation + ovulation day
- Consider flow patterns and symptoms for insights
- Confidence: high if cycles vary <3 days, medium if 3-5 days, low if >5 days

Current date: ${new Date().toISOString().split('T')[0]}`;

        const userPrompt = `Cycle History:\n${JSON.stringify(cycleHistory, null, 2)}`;
        
        let aiResponse = await invokeAIAgent(systemPrompt, userPrompt);
        aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const predictionData = JSON.parse(aiResponse);
        setPredictions(predictionData);
      } catch (error) {
        console.error('Error generating predictions:', error);
        setPredictions(null);
      } finally {
        setIsGeneratingPrediction(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingCycle) {
          await trickleUpdateObject(`cycle_tracking:${user.objectId}`, editingCycle.objectId, {
            PeriodStartDate: cycleForm.startDate,
            PeriodEndDate: cycleForm.endDate,
            FlowIntensity: cycleForm.flowIntensity,
            Symptoms: cycleForm.symptoms,
            Notes: cycleForm.notes
          });
        } else {
          await createCycleEntry(user.objectId, cycleForm);
        }
        resetForm();
        await loadCycles();
      } catch (error) {
        console.error('Error saving cycle entry:', error);
      }
    };

    const handleEdit = (cycle) => {
      setEditingCycle(cycle);
      setCycleForm({
        startDate: cycle.objectData.PeriodStartDate,
        endDate: cycle.objectData.PeriodEndDate || '',
        flowIntensity: cycle.objectData.FlowIntensity,
        symptoms: cycle.objectData.Symptoms || [],
        notes: cycle.objectData.Notes || ''
      });
      setShowForm(true);
    };

    const handleDelete = async (cycleId) => {
      if (confirm('Are you sure you want to delete this cycle entry?')) {
        try {
          await trickleDeleteObject(`cycle_tracking:${user.objectId}`, cycleId);
          loadCycles();
        } catch (error) {
          console.error('Error deleting cycle entry:', error);
        }
      }
    };

    const resetForm = () => {
      setCycleForm({
        startDate: '',
        endDate: '',
        flowIntensity: 'Medium',
        symptoms: [],
        notes: ''
      });
      setEditingCycle(null);
      setShowForm(false);
    };

    const toggleSymptom = (symptom) => {
      const newSymptoms = cycleForm.symptoms.includes(symptom)
        ? cycleForm.symptoms.filter(s => s !== symptom)
        : [...cycleForm.symptoms, symptom];
      setCycleForm({...cycleForm, symptoms: newSymptoms});
    };

    if (isLoading) {
      return <div className="animate-pulse">Loading cycle data...</div>;
    }

    return (
      <div className="space-y-6" data-name="cycle-tracker" data-file="components/CycleTracker.js">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cycle Tracker</h1>
            <p className="text-sm text-gray-600 mt-1">Track and predict your menstrual cycle</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center space-x-2 flex-1 sm:flex-none justify-center"
            >
              <div className="icon-plus text-lg"></div>
              <span>Log Period</span>
            </button>
            {cycles.length > 0 && (
              <button
                onClick={() => generateCyclePredictions(cycles)}
                disabled={isGeneratingPrediction}
                className="btn btn-secondary flex items-center space-x-2 flex-1 sm:flex-none justify-center"
              >
                <div className={`icon-sparkles text-lg ${isGeneratingPrediction ? 'animate-spin' : ''}`}></div>
                <span className="hidden sm:inline">Predict</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Predictions Card */}
        {predictions && !isGeneratingPrediction && (
          <div className="card bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gradient flex items-center space-x-2">
                <div className="icon-sparkles text-2xl"></div>
                <span>AI Cycle Predictions</span>
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                predictions.nextPeriodConfidence === 'high' 
                  ? 'bg-green-100 text-green-700' 
                  : predictions.nextPeriodConfidence === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {predictions.nextPeriodConfidence} confidence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="icon-calendar text-lg sm:text-xl text-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Next Period</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  In {Math.ceil((new Date(predictions.nextPeriodDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="icon-activity text-lg sm:text-xl text-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Cycle Length</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">{predictions.averageCycleLength} days</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 capitalize">{predictions.cycleRegularity} pattern</p>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="icon-heart text-lg sm:text-xl text-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Fertility Window</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">
                      {new Date(predictions.fertilityWindow.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(predictions.fertilityWindow.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Ovulation: {new Date(predictions.fertilityWindow.ovulationDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {predictions.insights && predictions.insights.length > 0 && (
                <div className="bg-white rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm sm:text-base">
                    <div className="icon-lightbulb text-yellow-500 text-lg"></div>
                    <span>Personalized Insights</span>
                  </h3>
                  <ul className="space-y-2">
                    {predictions.insights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700">
                        <div className="icon-check-circle text-green-500 mt-0.5 flex-shrink-0 text-sm"></div>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {predictions.recommendations && predictions.recommendations.length > 0 && (
                <div className="bg-white rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm sm:text-base">
                    <div className="icon-star text-purple-500 text-lg"></div>
                    <span>Recommendations</span>
                  </h3>
                  <ul className="space-y-2">
                    {predictions.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700">
                        <div className="icon-arrow-right text-purple-500 mt-0.5 flex-shrink-0 text-sm"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg flex items-start space-x-2">
              <div className="icon-info text-blue-500 text-sm mt-0.5 flex-shrink-0"></div>
              <p className="text-xs text-blue-700">
                Predictions are based on your cycle history. Track more cycles for improved accuracy. This is educational information, not medical advice.
              </p>
            </div>
          </div>
        )}

        {isGeneratingPrediction && (
          <div className="card text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your cycle patterns...</p>
          </div>
        )}

        {/* Empty State for No Predictions */}
        {!predictions && !isGeneratingPrediction && cycles.length === 0 && (
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 text-center py-8">
            <div className="icon-calendar-heart text-4xl text-purple-300 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Tracking Your Cycle</h3>
            <p className="text-gray-600 mb-4">Log your first period to get AI-powered predictions and insights</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mx-auto"
            >
              Log Your First Period
            </button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingCycle ? 'Edit Period Entry' : 'Log New Period'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="date"
                  placeholder="Start Date"
                  className="input-field"
                  value={cycleForm.startDate}
                  onChange={(e) => setCycleForm({...cycleForm, startDate: e.target.value})}
                  required
                />
                <input
                  type="date"
                  placeholder="End Date (optional)"
                  className="input-field"
                  value={cycleForm.endDate}
                  onChange={(e) => setCycleForm({...cycleForm, endDate: e.target.value})}
                />
                <select
                  className="input-field"
                  value={cycleForm.flowIntensity}
                  onChange={(e) => setCycleForm({...cycleForm, flowIntensity: e.target.value})}
                >
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {symptomOptions.map(symptom => (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`text-sm p-2 rounded ${
                          cycleForm.symptoms.includes(symptom)
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Notes"
                  className="input-field h-20 resize-none"
                  value={cycleForm.notes}
                  onChange={(e) => setCycleForm({...cycleForm, notes: e.target.value})}
                />
                
                <div className="flex space-x-3">
                  <button type="submit" className="btn btn-primary flex-1">Save</button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cycles List */}
        <div className="space-y-3 sm:space-y-4">
          {cycles.map((cycle) => (
            <div key={cycle.objectId} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Period: {new Date(cycle.objectData.PeriodStartDate).toLocaleDateString()}
                      {cycle.objectData.PeriodEndDate && 
                        ` - ${new Date(cycle.objectData.PeriodEndDate).toLocaleDateString()}`
                      }
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(cycle)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        <div className="icon-edit text-blue-600"></div>
                      </button>
                      <button
                        onClick={() => handleDelete(cycle.objectId)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <div className="icon-trash-2 text-red-600"></div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="icon-droplet text-pink-600 text-sm"></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">Flow: {cycle.objectData.FlowIntensity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="icon-calendar-heart text-purple-600 text-sm"></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {cycle.objectData.PeriodEndDate ? 
                          `${Math.ceil((new Date(cycle.objectData.PeriodEndDate) - new Date(cycle.objectData.PeriodStartDate)) / (1000 * 60 * 60 * 24))} days` 
                          : 'Ongoing'
                        }
                      </span>
                    </div>
                  </div>

                  {cycle.objectData.Symptoms && cycle.objectData.Symptoms.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Symptoms:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cycle.objectData.Symptoms.map((symptom, index) => (
                          <span key={index} className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cycle.objectData.Notes && (
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{cycle.objectData.Notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {cycles.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-calendar-heart text-4xl text-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500">No cycle data recorded yet</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('CycleTracker component error:', error);
    return null;
  }
}