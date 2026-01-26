import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Helper to call Perplexity
async function callPerplexity(messages, model = 'sonar-pro') {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing PERPLEXITY_API_KEY environment variable.');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const topicArg = process.argv.slice(2).join(' ') || 'mẹo sức khỏe mùa đông';
  console.log(`🎬 TCM VIDEO FACTORY starting...`);
  console.log(`🔍 Researching topic: "${topicArg}" via Perplexity...`);

  try {
    // STEP 1: RESEARCH
    const researchPrompt = [
      {
        role: 'system',
        content: 'You are an expert content researcher. Return only the most viral, trending, and practical health topic related to the user request. Output only the TOPIC NAME and a 1-sentence description.'
      },
      {
        role: 'user',
        content: `Find the best video topic for: ${topicArg}`
      }
    ];

    const selectedTopic = await callPerplexity(researchPrompt);
    console.log(`✅ Selected Topic: ${selectedTopic}`);

    // STEP 2-5: PRODUCTION PLAN GENERATION
    console.log(`✍️ Generating full production plan (Script, Character, Prompts)...`);
    
    const productionPrompt = [
      {
        role: 'system',
        content: `You are an expert AI Video Producer following the "TCM Video Factory" workflow.
        
        RULES:
        1.  **Scripting**: Create a 32-second script (4 parts, 8s each). Tone: Friendly, easy to understand.
            - Part 1: Hook (Personal secret/experience).
            - Part 2: TCM/Scientific explanation.
            - Part 3: How-to guide.
            - Part 4: Conclusion + CTA + Disclaimer.
        2.  **Character**: Create a cute 3D Pixar-style anthropomorphic character description (1 line, English).
        3.  **Image Prompts (Nano Banana Pro)**: For EACH of the 4 script parts, create 2 image prompts (Start & End). English only. No Vietnamese text in prompts.
        4.  **Video Prompts (VEO3)**: For EACH of the 4 script parts, create 1 VEO3 prompt (8s, 9:16 vertical). 
            - Format: [Character Desc], Beat 1 [0-2s action], Beat 2 [2-4s action], Beat 3 [4-6s action], Beat 4 [6-8s action], Vietnamese dialogue "[Vietnamese Script Line]" [Voice Type] lip-sync, Pixar style.
        
        OUTPUT FORMAT (Markdown):
        # 🎬 Production Plan: [Topic Name]
        
        ## 1. Character Design
        **Prompt:** [English Prompt]

        ## 2. Segment 1: The Hook (0-8s)
        - **Script (VN):** "[Script]"
        - **Image Prompt (Start):** [Prompt]
        - **Image Prompt (End):** [Prompt]
        - **Video Prompt (VEO3):** [Prompt]

        ## 3. Segment 2: Explanation (8-16s)
        ... (Repeat for all 4 segments)
        `
      },
      {
        role: 'user',
        content: `Create a production plan for the topic: ${selectedTopic}`
      }
    ];

    const productionPlan = await callPerplexity(productionPrompt);
    
    // Save to file
    const filename = `PLAN_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    const outputPath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(outputPath, productionPlan, 'utf8');
    
    console.log(`\n🎉 DONE! Production plan saved to: ${filename}`);
    console.log(`\n--- PREVIEW ---\n`);
    console.log(productionPlan.substring(0, 500) + "...");

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
