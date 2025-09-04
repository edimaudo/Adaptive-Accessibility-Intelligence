export default async function handler(request, response) {
    const spaceId = process.env.STORYBLOK_SPACE_ID;
    const previewToken = process.env.STORYBLOK_PREVIEW_TOKEN;

    if (!spaceId || !previewToken) {
        return response.status(500).json({ error: 'Storyblok API credentials are not set.' });
    }

    try {
        const storyblokApiUrl = `https://api.storyblok.com/v2/cdn/stories/?token=${previewToken}&starts_with=`;
        const apiResponse = await fetch(storyblokApiUrl);
        const data = await apiResponse.json();
        
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch data from Storyblok API.' });
    }
}

