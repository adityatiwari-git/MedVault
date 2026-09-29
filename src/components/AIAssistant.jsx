import React from 'react';

function AIAssistant({ user }) {
  try {
    const [messages, setMessages] = React.useState([]);
    const [inputMessage, setInputMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [conversationContext, setConversationContext] = React.useState('');
    const [healthProfile, setHealthProfile] = React.useState({});

    React.useEffect(() => {
      // Add web search capability to window
      window.searchWeb = async (query, searchImage = false, dateRange = null) => {
        try {
          const response = await fetch('https://proxy-api.trickle-app.host/?url=https://api.search.brave.com/res/v1/web/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Subscription-Token': 'BSAQzJpRZKNIFJ21eG2j9aX_V9Cb0d4'
            },
            body: JSON.stringify({
              q: query,
              search_lang: 'en',
              ui_lang: 'en',
              count: 5,
              offset: 0,
              safesearch: 'moderate',
              freshness: dateRange || 'py'
            })
          });
          const data = await response.json();
          return data.web?.results?.map(r => `${r.title}: ${r.description}`).join('\n') || 'No results found';
        } catch (error) {
          console.error('Search error:', error);
          return 'Search unavailable';
        }
      };

      // Load user health profile
      loadHealthProfile();

      // Load conversation history from localStorage
      const savedMessages = localStorage.getItem(`medvault_chat_${user.objectId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
        // Rebuild conversation context
        const parsed = JSON.parse(savedMessages);
        const context = parsed.map(msg => `${msg.type}: ${msg.content}`).join('\n');
        setConversationContext(context);
      } else {
        // Welcome message for new users
        const welcomeMessage = {
          id: 1,
          type: 'ai',
          content: `**Welcome to MedVault AI! 👋**

Hi ${user.objectData.Name}! I'm your personal health assistant.

**What I can help with:**
• Menstrual cycle questions
• General health & wellness
• Medication information  
• Nutrition & fitness advice
• Latest 2025 health research

**How to get the best answers:**
• Ask specific questions
• Mention your age or health context when relevant
• I can search the web for latest medical information

Ask me anything to get started!`,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        localStorage.setItem(`medvault_chat_${user.objectId}`, JSON.stringify([welcomeMessage]));
      }
    }, [user]);

    // Save messages to localStorage whenever messages change
    React.useEffect(() => {
      if (messages.length > 0) {
        localStorage.setItem(`medvault_chat_${user.objectId}`, JSON.stringify(messages));
        // Update conversation context for AI
        const context = messages.slice(-10).map(msg => `${msg.type}: ${msg.content}`).join('\n');
        setConversationContext(context);
      }
    }, [messages, user.objectId]);

    const loadHealthProfile = async () => {
      try {
        // Load user health data
        const [documents, cycles, prescriptions] = await Promise.all([
          getUserDocuments(user.objectId, 5),
          getUserCycles(user.objectId, 3),
          getUserPrescriptions(user.objectId, 5)
        ]);

        const profile = {
          basicInfo: {
            name: user.objectData.Name,
            age: user.objectData.Age,
            gender: user.objectData.Gender
          },
          lastCycle: cycles[0] ? {
            startDate: cycles[0].objectData.PeriodStartDate,
            endDate: cycles[0].objectData.PeriodEndDate,
            flowIntensity: cycles[0].objectData.FlowIntensity,
            symptoms: cycles[0].objectData.Symptoms || []
          } : null,
          currentMedications: prescriptions.filter(p => p.objectData.ReminderEnabled).map(p => ({
            name: p.objectData.MedicineName,
            dosage: p.objectData.Dosage,
            frequency: p.objectData.Frequency
          })),
          recentDocuments: documents.map(d => ({
            category: d.objectData.Category,
            date: d.objectData.DateUploaded
          }))
        };

        setHealthProfile(profile);
        // Save persistent health profile
        localStorage.setItem(`medvault_health_profile_${user.objectId}`, JSON.stringify(profile));
      } catch (error) {
        console.error('Error loading health profile:', error);
      }
    };

    const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: inputMessage.trim(),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsLoading(true);

      try {
        // Get enhanced health context with persistent profile
        const savedProfile = localStorage.getItem(`medvault_health_profile_${user.objectId}`);
        const profile = savedProfile ? JSON.parse(savedProfile) : healthProfile;

        const healthContext = {
          userName: user.objectData.Name,
          userAge: user.objectData.Age,
          userGender: user.objectData.Gender,
          healthProfile: profile,
          conversationHistory: conversationContext,
          currentDate: new Date().toLocaleDateString()
        };

        let aiResponse;
        try {
          aiResponse = await getEnhancedHealthAssistanceWithSearch(userMessage.content, healthContext);
        } catch (aiError) {
          console.error('AI response error:', aiError);
          aiResponse = 'I\'m having trouble connecting right now. Please try asking again, or consult your healthcare provider for urgent concerns. 🌸';
        }

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error in message handling:', error);
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: '**Connection Error**\n\nSorry, I\'m having trouble right now. Please:\n• Try asking again\n• Check your internet connection\n• Contact support if this persists',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    const clearConversation = () => {
      // Create personalized welcome message with health context
      let healthSummary = '';
      if (healthProfile.lastCycle) {
        const daysSinceLastPeriod = Math.floor((new Date() - new Date(healthProfile.lastCycle.startDate)) / (1000 * 60 * 60 * 24));
        healthSummary = `\n\n**Your Health Summary:**\n• Last period: ${daysSinceLastPeriod} days ago\n• Current medications: ${healthProfile.currentMedications?.length || 0}`;
      }

      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `**Hi ${user.objectData.Name}! 👋**

I'm your personal health assistant. I remember your health profile and previous conversations.${healthSummary}

**What I can help with:**
• Women's health questions
• Cycle & fertility info  
• Latest medical research
• Wellness advice

What would you like to know?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(`medvault_chat_${user.objectId}`, JSON.stringify([welcomeMessage]));
      setConversationContext('');
      
      // Reload health profile to ensure it's current
      loadHealthProfile();
    };

    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]" data-name="ai-assistant" data-file="components/AIAssistant.js">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">AI Health Assistant</h1>
            <p className="text-gray-600">Quick, precise health guidance just for you</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={clearConversation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <div className="icon-refresh-cw text-lg"></div>
              <span>New Chat</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <div className="icon-shield-check text-lg"></div>
              <span>Private & Secure</span>
            </div>
          </div>
        </div>

        {/* Quick Action Suggestions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick start:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "What's a normal menstrual cycle?",
                "Latest 2025 women's health research"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion)}
                  className="text-left p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col mb-4">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{paddingBottom: '1rem'}}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-bounce w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div className="animate-bounce w-2 h-2 bg-gray-500 rounded-full" style={{animationDelay: '0.1s'}}></div>
                    <div className="animate-bounce w-2 h-2 bg-gray-500 rounded-full" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="border-t p-3 bg-yellow-50 text-xs lg:text-sm text-yellow-800">
            <div className="flex items-start space-x-2">
              <div className="icon-info text-sm lg:text-lg mt-0.5 flex-shrink-0"></div>
              <p>
                This AI provides general health information only and is not medical advice. Always consult your healthcare provider for medical decisions.
              </p>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="border-t p-3 lg:p-4">
            <div className="flex space-x-2 lg:space-x-3">
              <input
                type="text"
                placeholder="Ask me about your health..."
                className="flex-1 input-field text-sm lg:text-base py-2 lg:py-3"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="btn btn-primary flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto p-2 lg:px-4 lg:py-3"
              >
                <div className="icon-send text-lg"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AIAssistant component error:', error);
    return null;
  }
}
export default AIAssistant;
