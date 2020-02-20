const puppeteer = require('puppeteer');
const fs = require('fs')

const CRX_PATH = '../../web-extension';
const REFERENCE_EBOOK_PATH = 'reference-ebook'
const TEST_RESULT_EBOOK_PATH = 'test-result-ebook'
const TEST_EBOOK_FILE_NAME = 'test.epub'

const testPaths = [

]

puppeteer.launch({
  headless: false,
  args: [
    `--disable-extensions-except=${CRX_PATH}`,
    `--load-extension=${CRX_PATH}`,
    '--user-agent=PuppeteerTestingAgent'
  ]
}).then(async browser => {

    prepareTests()

    await runLocalFullPageTests(browser)
});

async function runLocalFullPageTests(browser) {

    const testedFileName = 'special-chars' // 'p2' //'p1'

    const testUrl = 'file://'+__dirname+'/pages/'+testedFileName+'/page/index.html'
    const resultDownloadPath = './pages/'+testedFileName+'/' + TEST_RESULT_EBOOK_PATH

    const page = await browser.newPage();
    await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: resultDownloadPath});
    await page.setViewport({ width: 1280, height: 800 })
    // await page.goto('https://en.wikipedia.org/wiki/E-book', { waitUntil: 'networkidle0' });
    // await page.goto('file://'+__dirname+'/../pages/p1/E-book - Wikipedia.html', { waitUntil: 'networkidle0' });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
}

function prepareTests() {
  const testedFileName = 'p1'
  const pathToDelete = './pages/'+testedFileName+'/'+TEST_RESULT_EBOOK_PATH+'/'+TEST_EBOOK_FILE_NAME
  try {
    if (fs.existsSync(pathToDelete)) {
      fs.unlinkSync(pathToDelete)
    }
  } catch(err) {
    console.log('Error while deleting file ', err);
  }
}