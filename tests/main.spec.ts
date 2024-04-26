import axios from 'axios';
import { chromium } from 'playwright';
import { test } from '@playwright/test';
import fs from 'fs';

test.setTimeout(0);

async function postRequest(targetphrase: string, links: string[]) {
    const response = await axios.post('http://localhost:5000/compare', {
        target_phrase: targetphrase,
        phrases: links
    });
    return response.data.most_similar_phrase;
}

async function navigateWiki(targetphrase: string, startUrl: string, endUrl: string) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(startUrl);
    let currentUrl = startUrl; 

    let previousPhrases: string[] = [];

    while (page.url() !== endUrl) {
        const links: {text: string, href: string}[] = await page.$$eval('a', anchors => anchors.map(a => ({text: a.innerText.trim(), href: a.href})));

        const wikipediaLinks = links.filter(link => link.href.startsWith('https://en.wikipedia.org'));

        const newLinks = wikipediaLinks.filter(link => !previousPhrases.includes(link.text));

        const mostSimilarphrase = await postRequest(targetphrase, newLinks.map(link => link.text));

        console.log(`Most similar phrase: ${mostSimilarphrase}`); 

        const link = wikipediaLinks.find(link => link.text === mostSimilarphrase);

        if (link && link.href) {
            await page.goto(link.href);
        } else {
            console.log(`Link with text "${mostSimilarphrase}" not found or does not have a valid href.`);
        }

        previousPhrases.push(mostSimilarphrase);
    }
}

test('crawl', async ({ page }) => {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    await navigateWiki(config.target, config.starting, config.destination);
});



