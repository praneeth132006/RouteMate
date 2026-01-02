import { AI_CONFIG } from '../config/aiConfig';

// Mock data for testing without API key
const MOCK_ITINERARY = {
    success: true,
    itinerary: [
        {
            day: 1,
            title: "Arrival & Exploration",
            activities: [
                { time: "10:00 AM", title: "Check-in at Hotel", description: "Settle in and refresh." },
                { time: "12:00 PM", title: "Local Lunch", description: "Try famous local dishes." },
                { time: "02:00 PM", title: "City Walking Tour", description: "Explore the main landmarks." },
                { time: "07:00 PM", title: "Welcome Dinner", description: "Fine dining experience." }
            ]
        },
        {
            day: 2,
            title: "Cultural Dive",
            activities: [
                { time: "09:00 AM", title: "Museum Visit", description: "Learn about local history." },
                { time: "01:00 PM", title: "Traditional Market", description: "Shopping for souvenirs." },
                { time: "04:00 PM", title: "Park Relaxation", description: "Chill at the famous city park." }
            ]
        }
    ],
    expenses: [
        { category: "accommodation", amount: 200, note: "Hotel stay" },
        { category: "food", amount: 150, note: "Meals for 2 days" },
        { category: "transport", amount: 50, note: "Taxi and Metro" },
        { category: "activities", amount: 100, note: "Museum tickets & tours" }
    ]
};

// Helper to call Gemini AI with automated model discovery
const callGemini = async (prompt, isJson = true) => {
    const apiKey = AI_CONFIG.geminiKey;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('API Key is missing in src/config/aiConfig.js');
    }

    // List of reliable models to try if discovery isn't used
    const fallbackModels = [
        { ver: 'v1beta', name: 'gemini-1.5-flash' },
        { ver: 'v1beta', name: 'gemini-1.5-flash-latest' },
        { ver: 'v1', name: 'gemini-1.5-flash' },
        { ver: 'v1beta', name: 'gemini-pro' }
    ];

    let lastError = null;

    // Nuclear Fix: Try to discover what models THIS KEY actually has access to
    try {
        console.log('[AI Discovery] Fetching available models for your key...');
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        if (listRes.ok) {
            const listData = await listRes.json();
            const supportModels = listData.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name); // e.g., "models/gemini-1.5-flash"

            if (supportModels.length > 0) {
                console.log(`[AI Discovery] Found ${supportModels.length} models. Using: ${supportModels[0]}`);
                // Use the first discovered model
                const url = `https://generativelanguage.googleapis.com/v1beta/${supportModels[0]}:generateContent?key=${apiKey}`;
                return await executeGeminiRequest(url, prompt, isJson);
            }
        }
    } catch (e) {
        console.warn('[AI Discovery] Discovery failed, falling back to brute force.', e.message);
    }

    // Brute force fallback loop
    for (const attempt of fallbackModels) {
        const url = `https://generativelanguage.googleapis.com/${attempt.ver}/models/${attempt.name}:generateContent?key=${apiKey}`;
        try {
            return await executeGeminiRequest(url, prompt, isJson);
        } catch (err) {
            console.error(`[AI Attempt Failed] ${attempt.name} on ${attempt.ver}:`, err.message);
            lastError = err.message;
        }
    }

    // If we get here, all attempts failed
    let finalMsg = "No models available for this key.";
    try { finalMsg = JSON.parse(lastError).error?.message || lastError; } catch (e) { /* ignore parse error */ }
    throw new Error(finalMsg);
};

// Generate trip itinerary
export const generateTripItinerary = async (destination, days, budget, interests = []) => {
    console.log(`[AI Service] Generating real trip for ${destination}`);

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination} with a budget of ${budget}. 
    Interests: ${interests.join(', ')}.
    Return ONLY a JSON object with this exact structure:
    {
      "success": true,
      "itinerary": [
        {
          "day": 1,
          "title": "Day Title",
          "activities": [
            { "time": "hh:mm AM/PM", "title": "Activity Name", "description": "Brief description" }
          ]
        }
      ],
      "expenses": [
        { "category": "food/transport/accommodation/activities", "amount": 100, "note": "Brief note" }
      ]
    }`;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error('[AI Service] Gemini Error:', error);
        return { success: false, error: error.message };
    }
};

// Generate packing list
export const generatePackingList = async (destination, month, duration, type) => {
    console.log(`[AI Service] Generating real packing list for ${destination}`);

    const prompt = `Create a packing list for a ${duration}-day ${type} trip to ${destination} in the month of ${month}.
    Return ONLY a JSON object with this exact structure:
    {
      "success": true,
      "recommendations": [
        { "category": "Category Name", "items": ["Item 1", "Item 2"] }
      ]
    }`;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error('[AI Service] Packing Gemini Error:', error);
        return { success: false, error: error.message };
    }
};

// Chat with assistant
export const chatWithAssistant = async (message, tripContext = {}) => {
    const prompt = `You are RouteMate, a professional travel assistant. 
    Context: Trip to ${tripContext.destination || 'a destination'}.
    User Message: ${message}
    Provide a helpful, concierge-style response. Be specific and friendly.`;

    try {
        return await callGemini(prompt, false);
    } catch (error) {
        console.error('[AI Chat] Error:', error);
        return "I'm having a little trouble connecting to my travel database. Please check your internet or try again in a moment!";
    }
};

// Internal helper for actual fetch execution
const executeGeminiRequest = async (url, prompt, isJson) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                ...(isJson && { responseMimeType: "application/json" })
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new Error('Malformed AI response');
    }

    const text = data.candidates[0].content.parts[0].text;
    if (isJson) {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    }
    return text;
};
