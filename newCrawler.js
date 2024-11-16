const { JSDOM } = require('jsdom');
const { URL } = require('url');

const visitedUrls = new Set();
const crawledContent = new Map();
let timesLeft = 10;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawlPage(pageUrl) {
    timesLeft--;
    if (timesLeft <= 0) {
        return;
    }

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
        crawledContent.set(cleanUrl.href, mainContent);

        const links = Array.from(document.querySelectorAll('a')).map(link => link.getAttribute('href'));
        for (let href of links) {
            if (href && href.startsWith('/wiki/') && !href.includes(':')) {
                const resolvedUrl = new URL(href, cleanUrl.origin).href;
                const normalizedUrl = resolvedUrl.split('#')[0];

                if (!visitedUrls.has(normalizedUrl)) {
                    await delay(200);
                    await crawlPage(normalizedUrl);
                }
            }
        }
    } catch (error) {
        console.error(`Error crawling ${cleanUrl.href}:`, error);
    }
}

module.exports = async function (context, req) {
    const urlToCrawl = req.query.url || 'https://en.wikipedia.org/wiki/Elasticsearch';
    context.log(`Starting crawl for URL: "${urlToCrawl}"`);

    // Reset state for each request
    visitedUrls.clear();
    crawledContent.clear();
    timesLeft = 10;

    await crawlPage(urlToCrawl);

    const result = Object.fromEntries(crawledContent);
    context.log('Crawl completed');

    context.res = {
        body: result
    };
};