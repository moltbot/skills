# Demo Planning Guide

How to plan and structure effective product demos.

## Demo Structure

### 1. Hook (5-10 seconds)
Start with the most impressive or valuable feature. Grab attention immediately.

### 2. Core Flow (30-60 seconds)
Show the primary use case end-to-end:
- User action → System response → Value delivered
- Keep it focused on ONE workflow

### 3. Key Features (15-30 seconds each)
Highlight 2-3 differentiating features:
- Show, don't tell
- Each feature gets its own mini-sequence

### 4. Polish Moments (throughout)
Sprinkle micro-interactions that show quality:
- Hover states, transitions, animations
- Loading states, feedback
- Keyboard shortcuts

## Timing Guidelines

| Action | Duration |
|--------|----------|
| Page load | 2-3 seconds |
| Read content | 1.5-2 seconds |
| Button click | 0.5 seconds |
| Dropdown open | 1-1.5 seconds |
| Form filling | 0.5s per field |
| Show result | 2-3 seconds |
| Transition | 0.5 seconds |

**Total demo length:**
- Quick teaser: 15-30 seconds
- Feature highlight: 45-60 seconds  
- Full walkthrough: 2-3 minutes max

## Interaction Patterns

### Show Interactivity
```javascript
// Hover to reveal tooltips/states
await element.hover();
await page.waitForTimeout(1000);

// Click to expand/show more
await element.click();
await page.waitForTimeout(1500);
```

### Natural Text Input
```javascript
// Type slowly for readability
await input.type('search query', { delay: 100 });
```

### Scroll to Reveal
```javascript
// Smooth scroll
await page.evaluate(() => {
  window.scrollBy({ top: 300, behavior: 'smooth' });
});
await page.waitForTimeout(1000);
```

### Drag and Drop
```javascript
// Simulate drag
await page.locator('.draggable').dragTo(page.locator('.dropzone'));
```

## What Makes Demos Compelling

### Do
- Start at a meaningful state (data pre-populated)
- Show real-looking data, not "Test User" and "Lorem ipsum"
- Capture hover states, micro-interactions
- End on a satisfying completion (success toast, result)
- Match the rhythm users would actually experience

### Don't
- Rush through complex features
- Show error states (unless that's the point)
- Include loading spinners longer than 1 second
- Record empty states or onboarding flows (unless relevant)
- Leave dropdowns/modals open when moving to next section

## Demo Checklist

Before recording:
- [ ] App in demo-ready state (good data, clean UI)
- [ ] Browser window sized appropriately (1280x720 or 1920x1080)
- [ ] No notifications, popups, or dev tools visible
- [ ] Sequences written and tested manually first

After recording:
- [ ] Watch full playback at 1x speed
- [ ] Check for timing issues (too fast/slow)
- [ ] Verify all interactions are visible
- [ ] Trim any dead time at start/end
