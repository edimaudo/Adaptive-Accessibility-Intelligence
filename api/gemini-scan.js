export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // FIX: Accept both URL and HTML parameters from the request body
  const { url, html } = await req.json();
  let auditContent = '';

  if (url) {
    auditContent = `URL to audit: ${url}`;
  } else if (html) {
    auditContent = `HTML content to audit:\n\n\`\`\`html\n${html}\n\`\`\``;
  } else {
    return new Response(JSON.stringify({ error: 'Missing URL or HTML content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // Step 1: Perform the search to get grounded content
  let groundedContent = '';
  if (url) {
    const searchPayload = {
      contents: [{ parts: [{ text: `Search for accessibility audit report of the URL: ${url}` }] }],
      tools: [{ "google_search": {} }]
    };

    try {
      const searchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload),
      });

      if (!searchResponse.ok) {
        throw new Error(`Search API call failed with status ${searchResponse.status}`);
      }
      const searchResult = await searchResponse.json();
      groundedContent = searchResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (searchError) {
      console.error("Error during search grounding:", searchError);
      // Continue with the main audit even if search grounding fails
    }
  }

  // Step 2: Pass the grounded content to the main audit prompt
  const systemPrompt = `
    You are an AI accessibility auditor. Your task is to perform an accessibility audit of a website at the given URL, using any provided search context. The output should be a single JSON object with the following keys:
    - "score": A number from 0 to 100 representing the overall accessibility score.
    - "critical_issues": An array of strings, with each string describing a critical accessibility issue. If none, an empty array.
    - "warnings": An array of strings, with each string describing a warning or minor issue. If none, an empty array.
    
    IMPORTANT: Do not include any extra text, Markdown, code blocks (e.g., \`\`\`json), or explanations before or after the JSON. Return only the raw JSON string.
  `;

  const finalPayload = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\n${auditContent}\n\nSearch Context:\n${groundedContent}` }] }],
  };

  try {
    const finalResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json();
      throw new Error(`Gemini API call failed: ${errorData.error.message}`);
    }

    const result = await finalResponse.json();
    const textResult = result.candidates[0].content.parts[0].text;
    
    // FIX: Clean the string by removing the code fence and any surrounding whitespace
    const cleanText = textResult.trim().replace(/^```json\n|```$/g, '');
    const data = JSON.parse(cleanText);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    // FIX: Provide the raw output in the error message for debugging
    return new Response(JSON.stringify({ 
      error: `An error occurred during the scan. Could not parse JSON from Gemini API. Original error: ${error.message}`,
      raw_api_output: textResult || "No raw text available"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
