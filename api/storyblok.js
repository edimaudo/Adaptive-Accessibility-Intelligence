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

  const previewToken = process.env.STORYBLOK_PREVIEW_TOKEN;
  const spaceId = process.env.STORYBLOK_SPACE_ID;

  if (!previewToken || !spaceId) {
    return new Response(JSON.stringify({ error: 'Storyblok API credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const storyblokApiUrl = `https://api.storyblok.com/v2/cdn/stories/?starts_with=${url}&version=draft&token=${previewToken}&space_id=${spaceId}`;

  try {
    const response = await fetch(storyblokApiUrl);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Storyblok API call failed with status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const stories = data.stories;

    if (!stories || stories.length === 0) {
      return new Response(JSON.stringify({ error: 'Story not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ content: stories[0].content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching from Storyblok API:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
