/ Handler function for Vercel Serverless Function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const STORYBLOK_PREVIEW_TOKEN = process.env.STORYBLOK_PREVIEW_TOKEN;
        const STORYBLOK_SPACE_ID = process.env.STORYBLOK_SPACE_ID;

        if (!STORYBLOK_SPACE_ID) {
             return res.status(500).json({ error: 'Storyblok space ID is not configured.' });
        }

        const storyblokApiUrl = `https://api.storyblok.com/v2/cdn/stories?starts_with=${url}&version=draft&token=${STORYBLOK_PREVIEW_TOKEN}&space_id=${STORYBLOK_SPACE_ID}`;

        const response = await fetch(storyblokApiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Storyblok API call failed');
        }

        const data = await response.json();
        const stories = data.stories;

        if (!stories || stories.length === 0) {
            return res.status(404).json({ error: 'No stories found for this URL.' });
        }

        const content = stories[0].content;
        res.status(200).json({ content });

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        res.status(500).json({ error: error.message });
    }
}
