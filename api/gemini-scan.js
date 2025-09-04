
export default async function handler(request, response) {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return response.status(500).json({ error: 'Gemini API key is not set.' });
    }

    const { content } = request.body;

    const systemPrompt = `Analyze the provided content for accessibility issues. Evaluate it based on common accessibility standards (WCAG). Provide a single JSON object with a numeric 'score' out of 100, an array of strings for 'warnings', and an array of strings for 'critical_issues'. The issues should be specific and actionable.`;

    const payload = {
        contents: [{ parts: [{ text: content }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "score": { "type": "NUMBER" },
                    "warnings": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "critical_issues": { "type": "ARRAY", "items": { "type": "STRING" } }
                },
                "propertyOrdering": ["score", "warnings", "critical_issues"]
            }
        }
    };
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            throw new Error(errorData.error.message || 'Gemini API request failed.');
        }

        const result = await apiResponse.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            response.status(200).json(JSON.parse(jsonText));
        } else {
            throw new Error('Invalid response format from Gemini API.');
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
}
