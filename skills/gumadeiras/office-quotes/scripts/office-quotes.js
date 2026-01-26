#!/usr/bin/env node

/**
 * office-quotes CLI tool for Clawdbot
 * 
 * Usage: node office-quotes.js [--mode offline|api] [--theme dark|light] [--format png|jpg|webp]
 */

const API_BASE = "https://officeapi.akashrajpurohit.com";
const fs = require('fs');
const { execSync } = require('child_process');

// Check for Playwright
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
let mode = "offline";
let theme = "dark";
let outputFormat = "svg"; // svg, png, jpg, webp

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--mode" && args[i + 1]) {
    mode = args[++i];
  } else if (arg === "--theme" && args[i + 1]) {
    theme = args[++i];
  } else if (arg === "--format" && args[i + 1]) {
    outputFormat = args[++i].toLowerCase();
  }
}

async function getOfflineQuote() {
  const quotes = [
    { character: "Michael Scott", content: "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me." },
    { character: "Jim Halpert", content: "Bears. Beets. Battlestar Galactica." },
    { character: "Dwight Schrute", content: "Whenever I'm about to do something, I think, 'Would an idiot do that?' And if they would, I do not do that thing." },
    { character: "Michael Scott", content: "That's what she said!" },
    { character: "Michael Scott", content: "I am Beyoncé, always." },
    { character: "Dwight Schrute", content: "How would I describe myself? Three words: hardworking, alpha male, jackhammer, merciless, insatiable." },
    { character: "Pam Beesly", content: "I feel God in this Chili's tonight." },
    { character: "Andy Bernard", content: "I wish there was a way to know you're in the good old days, before you've actually left them." },
    { character: "Michael Scott", content: "I'm not superstitious, but I am a little stitious." },
    { character: "Michael Scott", content: "I love inside jokes. Love to be a part of one someday." },
    { character: "Michael Scott", content: "Fool me once, strike one. Fool me twice, strike three." },
    { character: "Michael Scott", content: "Sometimes I'll start a sentence and I don't even know where it's going. I just hope I find it along the way." },
    { character: "Michael Scott", content: "You miss 100 percent of the shots you don't take. Wayne Gretzky." },
    { character: "Michael Scott", content: "I... declare... bankruptcy!" },
    { character: "Michael Scott", content: "It's Britney, bitch." },
    { character: "Dwight Schrute", content: "'R' is among the most menacing of sounds. That's why they call it 'murder' and not 'mukduk.'" },
    { character: "Kevin Malone", content: "Why waste time say lot word when few word do trick?" },
    { character: "Angela Martin", content: "I'm not gaining anything from this seminar. I'm a professional woman. The head of accounting. I'm in the healthiest relationship of my life." },
    { character: "Kelly Kapoor", content: "I talk a lot, so I've learned to tune myself out." },
    { character: "Oscar Martinez", content: "Saddle Shoes With Denim? I Will Literally Call Protective Services." }
  ];
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  return { quote: quote.content, character: quote.character };
}

async function renderWithPlaywright(svgPath, outputFormat) {
  const ext = outputFormat.toLowerCase();
  const outputPath = svgPath.replace(/\.[^.]+$/, `.${ext}`);
  
  if (ext === 'svg') {
    return svgPath;
  }
  
  // Create HTML wrapper for proper rendering
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const htmlPath = svgPath.replace(/\.svg$/, '.html');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<style>
body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #111827; }
svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;
  
  fs.writeFileSync(htmlPath, htmlContent);
  
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 420 } });
  
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(1500);
  
  // Screenshot the SVG element
  await page.locator('svg').screenshot({ path: outputPath });
  
  await browser.close();
  
  // Cleanup HTML
  fs.unlinkSync(htmlPath);
  
  return outputPath;
}

async function convertImage(svgPath, outputFormat) {
  const ext = outputFormat.toLowerCase();
  
  if (ext === 'svg') {
    return svgPath;
  }
  
  try {
    return await renderWithPlaywright(svgPath, outputFormat);
  } catch (error) {
    return { error: error.message, status: 'error' };
  }
}

async function getApiQuote() {
  const svgUrl = `${API_BASE}/quote/random?responseType=svg&mode=${theme}&width=500&height=300`;
  const jsonUrl = `${API_BASE}/quote/random?responseType=json`;
  
  try {
    // Get JSON for quote text
    const jsonRes = await fetch(jsonUrl);
    const data = await jsonRes.json();
    
    // Fetch and save SVG
    const svgRes = await fetch(svgUrl);
    const svgText = await svgRes.text();
    
    // Check for empty response
    if (!svgText || svgText.trim().length < 100) {
      return {
        quote: data.quote,
        character: data.character,
        error: "API returned empty image - please try again",
        avatarUrl: data.character_avatar_url
      };
    }
    
    const tempSvg = `/tmp/office_quote_${Date.now()}.svg`;
    fs.writeFileSync(tempSvg, svgText);
    
    if (outputFormat !== 'svg') {
      // Convert using Playwright
      const conversionResult = await convertImage(tempSvg, outputFormat);
      fs.unlinkSync(tempSvg); // Clean up SVG
      
      if (conversionResult && conversionResult.status === 'error') {
        return {
          quote: data.quote,
          character: data.character,
          error: conversionResult.error,
          avatarUrl: data.character_avatar_url
        };
      }
      
      return {
        quote: data.quote,
        character: data.character,
        imagePath: conversionResult,
        format: outputFormat,
        avatarUrl: data.character_avatar_url
      };
    }
    
    return {
      quote: data.quote,
      character: data.character,
      imagePath: tempSvg,
      format: 'svg',
      svgUrl: svgUrl,
      avatarUrl: data.character_avatar_url
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  let result;
  
  if (mode === "api") {
    result = await getApiQuote();
  } else {
    result = await getOfflineQuote();
  }
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
