// api/fetchPaste.js

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
        // Basic validation
        if (!rawPasteUrl.startsWith('https://pastebin.com/raw/')) {
            throw new Error('Invalid URL format');
        }
    } catch (e) {
        response.status(400).json({ error: 'Invalid or malformed rawPasteUrl parameter' });
        return;
    }

    try {
        // Use native fetch available in Node.js 18+ (Vercel standard)
        const pasteResponse = await fetch(rawPasteUrl, {
             headers: {
                 // Pastebin generally doesn't require special headers for raw fetch,
                 // but a User-Agent might be polite/helpful in some cases.
                 'User-Agent': 'BoltBot-Copy-Service/1.0'
             }
        });

        if (!pasteResponse.ok) {
            // Forward Pastebin's error status if possible
             console.error(`Pastebin fetch failed for ${rawPasteUrl}: Status ${pasteResponse.status}`);
            response.status(pasteResponse.status).json({ error: `Failed to fetch from Pastebin: ${pasteResponse.statusText}` });
            return;
        }

        const content = await pasteResponse.text();

        // Set CORS headers (Vercel often handles this for same-origin API routes, but explicit is good)
        // Allow requests from your Vercel deployment domain
        // response.setHeader('Access-Control-Allow-Origin', 'https://boltbot-copy.vercel.app'); // Or '*' for testing, less secure
        // response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        // response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

         // Send the plain text content back
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.status(200).send(content);

    } catch (error) {
        console.error(`Error in /api/fetchPaste fetching ${rawPasteUrl}:`, error);
        response.status(500).json({ error: `Server error fetching paste content: ${error.message}` });
    }
}
