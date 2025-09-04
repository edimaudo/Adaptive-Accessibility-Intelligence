export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // FIX: Change to allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const previewToken = process.env.STORYBLOK_PREVIEW_TOKEN;
  const spaceId = process.env.STORYBLOK_SPACE_ID;

  if (!previewToken || !spaceId) {
    return new Response(JSON.stringify({ error: 'Storyblok API credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // FIX: Updated the API URL to fetch all stories from the space and removed the URL parameter check
  const storyblokApiUrl = `https://api.storyblok.com/v2/cdn/stories/?version=draft&token=${previewToken}&space_id=${spaceId}`;

  try {
    const response = await fetch(storyblokApiUrl);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Storyblok API call failed with status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ stories: data.stories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching from Storyblok API:", error);
    return new Response(JSON.stringify({ error: error.message || 'An error occurred fetching Storyblok content.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
