const { app } = require('@azure/functions');
const { JSDOM } = require('jsdom');

const visitedUrls = new Set();
const links = [
    "https://en.wikipedia.org/wiki/Elasticsearch",
    "https://en.wikipedia.org/wiki/Main_Page",
    "https://en.wikipedia.org/wiki/Wikipedia",
    "https://en.wikipedia.org/wiki/English_Wikipedia",
    "https://en.wikipedia.org/wiki/Internet_encyclopedia",
    "https://en.wikipedia.org/wiki/Online_encyclopedia",
    "https://en.wikipedia.org/wiki/Encyclopedia",
    "https://en.wikipedia.org/wiki/Encyclopedia_(disambiguation)",
    "https://en.wikipedia.org/wiki/Encyclopedia_(album)",
    "https://en.wikipedia.org/wiki/Album"
];

async function crawlPage(pageUrl) {
    const cleanUrl = new URL(pageUrl);
    cleanUrl.hash = '';

    if (visitedUrls.has(cleanUrl.href)) {
        return;
    }

    visitedUrls.add(cleanUrl.href);

    try {
        const response = await fetch(cleanUrl.href);
        if (!response.ok) {
            console.error(`Failed to fetch ${cleanUrl.href}: ${response.statusText}`);
            return;
        }

        const html = await response.text();
        const { window } = new JSDOM(html);
        const document = window.document;

        const mainContent = Array.from(document.querySelectorAll('.mw-parser-output p, .mw-parser-output h1, .mw-parser-output h2, .mw-parser-output h3'))
            .map(element => element.textContent.trim())
            .join(' ')
            .replace(/[\t\n\r]+/g, ' ')
            .trim();

        console.log('Indexing:', cleanUrl.href);
        return { url: cleanUrl.href, content: mainContent };

    } catch (error) {
        console.error(`Error crawling ${cleanUrl.href}:`, error);
    }
}

app.http('web-crawler-func-app', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        try {
            const crawledContent = await Promise.all(links.map(crawlPage));


            for (let i = 0; i < crawledContent.length; i++) {
                context.log(`URL: ${crawledContent[i].url}`);
                context.log(`Content: ${crawledContent[i].content.substring(0, 100)}`);
                context.log("==========================================================");
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(crawledContent),
            };
        } catch (error) {
            context.log.error('Crawl process failed:', error);
            return { status: 500, body: 'An error occurred during the crawl.' };
        }
        
    }
});
