export default async function handler(request, response) {
    const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
    const encodedRawPasteUrl = searchParams.get('rawPasteUrl');

    if (!encodedRawPasteUrl) {
        response.status(400).json({ error: 'Missing rawPasteUrl parameter' });
        return;
    }

    let rawPasteUrl;
    try {
        rawPasteUrl = decodeURIComponent(encodedRawPasteUrl);
        if (!rawPasteUrl.startsWith('https://pastecode.dev/raw/')) {
            throw new Error('Invalid URL format. Expected PasteCode raw URL.');
        }
    } catch (e) {
        response.status(400).json({ error: `Invalid or malformed rawPasteUrl parameter: ${e.message}` });
        return;
    }

    try {
        const pasteResponse = await fetch(rawPasteUrl, {
             headers: {
                 'User-Agent': 'BoltBot-Copy-Service/1.0'
             }
        });

        if (!pasteResponse.ok) {
            console.error(`PasteCode fetch failed for ${rawPasteUrl}: Status ${pasteResponse.status}`);
            response.status(pasteResponse.status).json({ error: `Failed to fetch from PasteCode: ${pasteResponse.statusText}` });
            return;
        }

        const content = await pasteResponse.text();

        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.status(200).send(content);

    } catch (error) {
        console.error(`Error in /api/fetchPaste fetching ${rawPasteUrl}:`, error);
        response.status(500).json({ error: `Server error fetching paste content: ${error.message}` });
    }
}
