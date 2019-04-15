const puppeteer = require('puppeteer');

const CRX_PATH = '../web-extension';

puppeteer.launch({
  headless: false,
  args: [
    `--disable-extensions-except=${CRX_PATH}`,
    `--load-extension=${CRX_PATH}`,
    '--user-agent=PuppeteerTestingAgent'
  ]
}).then(async browser => {

    const page = await browser.newPage();
    await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './tmp-downloads'});
    await page.setViewport({ width: 1280, height: 800 })
    // await page.goto('https://en.wikipedia.org/wiki/E-book', { waitUntil: 'networkidle0' });
    // await page.goto('file://'+__dirname+'/../pages/p1/E-book - Wikipedia.html', { waitUntil: 'networkidle0' });
    await page.goto('file://'+__dirname+'/../pages/p1/page/index.html', { waitUntil: 'networkidle0' });


  // await browser.close();
});
