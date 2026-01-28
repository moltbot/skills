#!/usr/bin/env node
/**
 * Demo Video Recorder
 * 
 * Records browser interactions as frames using Playwright CDP screencast.
 * Customize DEMO_SEQUENCES for your app.
 * 
 * Usage: node record-demo.js
 * 
 * Prerequisites:
 * - Clawdbot browser running (browser action=start profile=clawd)
 * - App accessible in browser
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// ============== CONFIGURATION ==============

const CONFIG = {
  // CDP endpoint for Clawdbot browser
  cdpEndpoint: 'http://127.0.0.1:18800',
  
  // Output settings
  outputDir: './demo-frames',
  frameSkip: 5,           // Keep every Nth frame (lower = more frames, smoother video)
  jpegQuality: 90,        // 1-100, higher = better quality, larger files
  
  // URL pattern to find the target page (or null to use first page)
  targetUrlPattern: 'localhost',
};

// ============== DEMO SEQUENCES ==============
// Customize this array for your app

const DEMO_SEQUENCES = [
  {
    name: 'Dashboard Overview',
    steps: async (page) => {
      await page.goto('http://localhost/dashboard');
      await page.waitForTimeout(2000);
      
      // Hover over a metric card
      const card = page.locator('[class*="card"]').first();
      if (await card.isVisible()) {
        await card.hover();
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(1500);
    }
  },
  
  {
    name: 'Feature Interaction',
    steps: async (page) => {
      // Example: Click a button, show dropdown
      const button = page.locator('button:has-text("Create")').first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1500);
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(1000);
    }
  },
  
  {
    name: 'Form Input',
    steps: async (page) => {
      // Example: Type in a search box
      const input = page.locator('input[placeholder*="Search"]').first();
      if (await input.isVisible()) {
        await input.fill('example query');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
    }
  },
];

// ============== RECORDING ENGINE ==============

async function recordDemo() {
  console.log('🎬 Starting demo recording...\n');
  
  // Connect to browser
  const browser = await chromium.connectOverCDP(CONFIG.cdpEndpoint);
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  // Find target page
  let page = CONFIG.targetUrlPattern
    ? pages.find(p => p.url().includes(CONFIG.targetUrlPattern)) || pages[0]
    : pages[0];
  
  console.log(`📍 Recording page: ${page.url()}\n`);
  
  // Start screencast
  const client = await page.context().newCDPSession(page);
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: CONFIG.jpegQuality,
    everyNthFrame: 1
  });
  
  const frames = [];
  client.on('Page.screencastFrame', async (event) => {
    frames.push(Buffer.from(event.data, 'base64'));
    await client.send('Page.screencastFrameAck', { sessionId: event.sessionId });
  });
  
  // Execute demo sequences
  for (const sequence of DEMO_SEQUENCES) {
    console.log(`▶️  ${sequence.name}...`);
    try {
      await sequence.steps(page);
    } catch (err) {
      console.warn(`   ⚠️  Error: ${err.message}`);
    }
  }
  
  // Stop recording
  await client.send('Page.stopScreencast');
  console.log(`\n📸 Captured ${frames.length} raw frames`);
  
  // Save frames (with skip)
  const outputDir = path.resolve(CONFIG.outputDir);
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });
  
  let savedCount = 0;
  for (let i = 0; i < frames.length; i += CONFIG.frameSkip) {
    const filename = `frame_${String(savedCount).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(outputDir, filename), frames[i]);
    savedCount++;
  }
  
  console.log(`💾 Saved ${savedCount} frames to ${outputDir}`);
  console.log('\n✅ Recording complete!');
  console.log(`\nNext: Run frames-to-video.sh to encode:\n  ./scripts/frames-to-video.sh ${CONFIG.outputDir} demo mp4`);
}

recordDemo().catch(console.error);
