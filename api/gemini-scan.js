import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // A simple URL validation
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

    if (!urlPattern.test(url)) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Construct the prompt with instructions for the AI
        // We instruct the model to return JSON in the prompt itself.
        const prompt = `
            Please act as a world-class accessibility auditor. You are given the URL of a webpage.
            Your task is to analyze the webpage at the provided URL and identify accessibility issues based on the Web Content Accessibility Guidelines (WCAG).

            You must respond with a JSON object containing the following structure. Do not include any text before or after the JSON.
            {
              "score": number,
              "criticalIssues": string[],
              "warnings": string[]
            }

            - "score": A number from 0 to 100 representing an overall accessibility score. 100 means perfect, 0 means completely inaccessible.
            - "criticalIssues": An array of strings, where each string describes a major, critical accessibility issue that must be fixed immediately.
            - "warnings": An array of strings, where each string describes a less severe issue or a best practice recommendation.

            Analyze the accessibility of this URL: ${url}
        `;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // We check the response status and then parse the JSON.
        // The API now returns a text response that contains the JSON string.
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API Error:', errorData);
            return res.status(500).json({ error: errorData.error.message || 'Gemini API call failed' });
        }
        
        const geminiData = await geminiResponse.json();
        
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) {
            return res.status(500).json({ error: 'No content from API.' });
        }
        
        // We need to parse the JSON from the raw text now.
        try {
            const auditResult = JSON.parse(rawText);
            return res.status(200).json(auditResult);
        } catch (jsonError) {
            console.error('Failed to parse JSON from API response:', rawText);
            return res.status(500).json({ error: 'The AI did not return a valid JSON format.' });
        }

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
}
