const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size to check layout
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'd:/my PF/vigo/iris-web/scratch/screenshot-top.png' });
    
    // Scroll down to the scrolling section
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 1.5);
    });
    
    // Wait a bit for GSAP animations
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'd:/my PF/vigo/iris-web/scratch/screenshot-scroll.png' });
    
    console.log("Screenshots captured successfully.");
  } catch (e) {
    console.error("Error capturing screenshots:", e);
  } finally {
    await browser.close();
  }
})();
