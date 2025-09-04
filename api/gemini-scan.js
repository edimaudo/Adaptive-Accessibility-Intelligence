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
        const searchResult = await searchResponse.json();
        groundedContent = searchResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (searchError) {
        console.error("Error during search grounding:", searchError);
    }
  }

  const systemPrompt = `
    You are an AI accessibility auditor. Your task is to perform a detailed accessibility audit of the given content.
    Return the results in a single, plain JSON object.
    
    The JSON object must have the following keys:
    - "summary": A concise paragraph summarizing the overall accessibility status.
    - "score": A numerical accessibility score from 0 to 100.
    - "critical_issues": An array of strings, each describing a critical accessibility issue. If none, an empty array.
    - "warnings": An array of strings, each describing a warning or minor issue. If none, an empty array.
    
    IMPORTANT: Do not include any extra text, Markdown, code blocks (e.g., \`\`\`json), or explanations before or after the JSON. Return only the raw JSON string.
  `;

  const finalPayload = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\n${auditContent}\n\nSearch Context:\n${groundedContent}` }] }],
  };

  let finalResponse;
  let textResult;

  try {
    finalResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json();
      throw new Error(`Gemini API call failed: ${errorData.error.message}`);
    }

    const result = await finalResponse.json();
    textResult = result.candidates[0].content.parts[0].text;
    
    const cleanText = textResult.trim().replace(/^```json\n|```$/g, '');
    const data = JSON.parse(cleanText);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    const raw_api_output = finalResponse ? await finalResponse.text() : "No raw text available";
    return new Response(JSON.stringify({ 
      error: `An error occurred during the scan. Could not parse JSON from Gemini API. Original error: ${error.message}`,
      raw_api_output: raw_api_output
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
