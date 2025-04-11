export default async function handler(request, response) {
    const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
    const pasteUuid = searchParams.get('pasteUuid');

    if (!pasteUuid) {
        response.status(400).json({ error: 'Missing pasteUuid parameter' });
        return;
    }

    const apiToken = process.env.PASTECODE_API_TOKEN;
    if (!apiToken) {
        console.error('PASTECODE_API_TOKEN environment variable not set on Vercel backend.');
        response.status(500).json({ error: 'Server configuration error: Missing API Token.' });
        return;
    }

    const pasteCodeApiUrl = `https://pastecode.dev/api/pastes/${pasteUuid}`;

    try {
        const pasteResponse = await fetch(pasteCodeApiUrl, {
             headers: {
                 'User-Agent': 'BoltBot-Copy-Service/1.0',
                 'Accept': 'application/json',
                 'Authorization': `Bearer ${apiToken}`
             }
        });

        if (!pasteResponse.ok) {
            let errorMsg = `Failed to fetch paste info from PasteCode API: ${pasteResponse.statusText}`;
            try {
                 const errorData = await pasteResponse.json();
                 if (errorData && errorData.message) {
                     errorMsg += ` - ${errorData.message}`;
                 }
            } catch(e) {}
            console.error(`PasteCode API fetch failed for UUID ${pasteUuid}: Status ${pasteResponse.status}`);
            response.status(pasteResponse.status).json({ error: errorMsg });
            return;
        }

        const pasteData = await pasteResponse.json();

        if (!pasteData || !pasteData.pasteFiles || pasteData.pasteFiles.length === 0 || typeof pasteData.pasteFiles[0].code === 'undefined') {
            console.error(`Invalid or incomplete paste data received from PasteCode API for UUID ${pasteUuid}:`, pasteData);
            response.status(500).json({ error: 'Received invalid data structure from PasteCode API.' });
            return;
        }

        const content = pasteData.pasteFiles[0].code;

        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.status(200).send(content);

    } catch (error) {
        console.error(`Error in /api/fetchPaste fetching API for UUID ${pasteUuid}:`, error);
        response.status(500).json({ error: `Server error fetching paste content via API: ${error.message}` });
    }
}
