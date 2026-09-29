// AI Agent utilities for health insights and assistance

async function generateDocumentSummary(documentText, category) {
  try {
    const systemPrompt = `You are a medical AI assistant specialized in creating easy-to-understand summaries of medical documents for women's health. 
    
    Your task is to analyze the provided medical document and create a clear, concise summary that:
    1. Explains key findings in simple terms
    2. Highlights important health information
    3. Identifies any concerns or recommendations
    4. Uses supportive, non-alarming language
    
    Document Category: ${category}
    
    IMPORTANT: You are providing informational summaries only, not medical advice or diagnoses.`;
    
    const userPrompt = `Medical Document Text: ${documentText}`;
    
    const summary = await invokeAIAgent(systemPrompt, userPrompt);
    return summary;
  } catch (error) {
    console.error('Error generating document summary:', error);
    return 'Unable to generate summary at this time.';
  }
}

async function generateCycleInsights(cycleData) {
  try {
    const systemPrompt = `You are a women's health AI assistant. Analyze menstrual cycle data and provide helpful insights about:
    1. Cycle regularity and patterns
    2. Potential fertile windows (educational purposes only)
    3. General wellness observations
    4. Supportive health suggestions
    
    Always emphasize this is educational information, not medical advice.`;
    
    const userPrompt = `Cycle Data: ${JSON.stringify(cycleData)}`;
    
    const insights = await invokeAIAgent(systemPrompt, userPrompt);
    return insights;
  } catch (error) {
    console.error('Error generating cycle insights:', error);
    return 'Unable to generate insights at this time.';
  }
}

async function getHealthAssistance(question, userHealthData) {
  try {
    const systemPrompt = `You are a supportive women's health AI assistant. Provide helpful, educational responses about:
    - General health and wellness
    - Menstrual health education
    - Medication information (not prescriptions)
    - Lifestyle recommendations
    
    Always remind users to consult healthcare professionals for medical decisions.
    User's Health Context: ${JSON.stringify(userHealthData)}`;
    
    const response = await invokeAIAgent(systemPrompt, question);
    return response;
  } catch (error) {
    console.error('Error getting health assistance:', error);
    return 'I apologize, but I cannot provide assistance right now. Please consult your healthcare provider for any health concerns.';
  }
}

async function getEnhancedHealthAssistance(question, userHealthContext) {
  try {
    const systemPrompt = `You are an expert women's health AI assistant for MedVault. Provide STRUCTURED, CONCISE, and ACTIONABLE responses.

RESPONSE FORMATTING RULES:
✅ Use bullet points or numbered lists for multiple pieces of information
✅ Break content into clear sections with headings when appropriate  
✅ Keep paragraphs short (2-3 sentences max)
✅ Use line breaks between different topics
✅ Include relevant emojis sparingly (1-2 per response)
✅ End medical topics with: "💡 Consult your doctor for personalized advice"

RESPONSE LENGTH: 100-200 words for simple questions, up to 300 for complex topics

CONVERSATION MEMORY: Reference previous messages to avoid repetition and build context.

USER PROFILE:
- Name: ${userHealthContext.userName}
- Age: ${userHealthContext.userAge}  
- Gender: ${userHealthContext.userGender}
- Health Records: ${userHealthContext.totalDocuments} documents
- Cycle Data: ${userHealthContext.recentCycles} entries
- Medications: ${userHealthContext.activePrescriptions} active
- Date: ${userHealthContext.currentDate}

CONVERSATION HISTORY:
${userHealthContext.conversationHistory}

SPECIALTIES: Women's reproductive health, menstrual cycles, contraception, pregnancy, hormones, nutrition, fitness, mental health, preventive care.

FORMAT EXAMPLE:
**Quick Answer:** [Direct response]

**Key Points:**
• Point 1
• Point 2  
• Point 3

**Next Steps:** [Actionable advice]

💡 Consult your doctor for personalized advice`;
    
    const response = await invokeAIAgent(systemPrompt, question);
    return response;
  } catch (error) {
    console.error('Error getting enhanced health assistance:', error);
    return 'I\'m having trouble connecting right now. Please try asking again, or consult your healthcare provider for urgent concerns. 🌸';
  }
}

async function getEnhancedHealthAssistanceWithSearch(question, userHealthContext) {
  try {
    // Check if web search might be helpful
    const needsSearch = question.toLowerCase().includes('2025') || 
                       question.toLowerCase().includes('latest') || 
                       question.toLowerCase().includes('recent') || 
                       question.toLowerCase().includes('new');

    let webContext = '';
    if (needsSearch) {
      try {
        if (window.searchWeb) {
          const searchResults = await window.searchWeb(`${question} women health 2025`, false, '2025');
          if (searchResults && searchResults !== 'Search unavailable') {
            webContext = `\n\nCURRENT RESEARCH (2025):\n${searchResults.slice(0, 500)}...`;
          }
        }
      } catch (searchError) {
        console.log('Search not available, using general knowledge');
        webContext = '';
      }
    }

    // Build persistent health profile context
    let healthProfileText = '';
    if (userHealthContext.healthProfile) {
      const profile = userHealthContext.healthProfile;
      healthProfileText = `\n\nUSER HEALTH PROFILE (PERSISTENT MEMORY):
• ${profile.basicInfo?.name}, Age ${profile.basicInfo?.age}, ${profile.basicInfo?.gender}`;
      
      if (profile.lastCycle) {
        const daysSince = Math.floor((new Date() - new Date(profile.lastCycle.startDate)) / (1000 * 60 * 60 * 24));
        healthProfileText += `\n• Last menstrual cycle: ${daysSince} days ago (${profile.lastCycle.flowIntensity} flow)`;
        if (profile.lastCycle.symptoms?.length > 0) {
          healthProfileText += `\n• Recent symptoms: ${profile.lastCycle.symptoms.join(', ')}`;
        }
      }
      
      if (profile.currentMedications?.length > 0) {
        healthProfileText += `\n• Current medications: ${profile.currentMedications.map(m => `${m.name} (${m.frequency})`).join(', ')}`;
      }
    }

    const systemPrompt = `You are an expert women's health AI assistant. Provide STRUCTURED, CONCISE responses.

FORMAT RULES:
• Use bullet points for lists
• Keep paragraphs short (2-3 sentences)
• Use headings for sections
• Include 1-2 relevant emojis
• End medical advice with: "💡 Consult your doctor for personalized advice"

USER: ${userHealthContext.userName}, Age ${userHealthContext.userAge}
CONVERSATION: ${userHealthContext.conversationHistory}${healthProfileText}${webContext}

Remember to reference their health profile when relevant. Response length: 100-200 words for simple questions, up to 300 for complex topics.`;
    
    const response = await invokeAIAgent(systemPrompt, question);
    return response;
  } catch (error) {
    console.error('AI assistance error:', error);
    throw error;
  }
}
