const fs = require('fs');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const waitOn = require('wait-on');
const argv = require('yargs').argv;
const url = argv.url;
const filePath = argv.filePath;
const screenPath = argv.screenPath;

waitOn({
  resources: [url]
}, async () => {
    const files = fs.readdirSync(filePath)
      .filter(file => /.html$/.test(file))
      .map(item => item.replace(/\.[^/.]+$/, ""));

    if (files.length && !fs.existsSync(screenPath)) {
      fs.mkdirSync(screenPath);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--start-fullscreen']
    });

    const page = await browser.newPage();

    for (let i = 0; i < files.length; i++) {
      let email = files[i];
      await page.goto(`${url}/emails/${email}.html`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await page.screenshot({
        path: `${screenPath}/${email}.png`,
        fullPage: true
      });
    }

    await browser.close();
});
