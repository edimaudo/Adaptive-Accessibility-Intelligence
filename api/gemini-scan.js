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

  const { url } = await req.json();

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
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

  const systemPrompt = `
    You are an AI accessibility auditor. Your task is to perform an accessibility audit of a website at a given URL and provide the results in a JSON format.
    The JSON object should have two keys: "summary" and "report".
    The "summary" key should contain a concise paragraph summarizing the overall accessibility status of the page.
    The "report" key should contain a detailed, structured report in Markdown format, with sections for each major accessibility issue found.
    Crucially, return ONLY the JSON object. Do not include any other text, explanations, or code fences outside of the JSON.
  `;

  const payload = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\nURL to audit: ${url}` }] }],
    tools: [{ google_search: {} }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API call failed: ${errorData.error.message}`);
    }

    const result = await response.json();
    const textResult = result.candidates[0].content.parts[0].text;
    const data = JSON.parse(textResult);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return new Response(JSON.stringify({ error: error.message || 'An error occurred during the scan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
