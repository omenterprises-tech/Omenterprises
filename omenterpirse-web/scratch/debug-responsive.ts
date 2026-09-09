import { chromium } from "playwright";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
  });
  
  const page = await context.newPage();
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000");
  
  // Wait for images to load
  await page.waitForTimeout(2000);
  
  // Query all images in the carousel
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.map(img => {
      const rect = img.getBoundingClientRect();
      return {
        src: img.src,
        className: img.className,
        width: rect.width,
        height: rect.height,
        display: window.getComputedStyle(img).display
      };
    });
  });
  
  console.log("Cloudinary images on mobile view:");
  console.log(JSON.stringify(images.filter(img => img.src.includes("cloudinary")), null, 2));
  
  await browser.close();
}

main().catch(console.error);
