#!/usr/bin/env node

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function pickEasterEggs(items) {
  const eggs = [];
  eggs.push("a tiny banana sticker hidden on a studio camera");
  eggs.push("a small lion plush sitting on a side table");

  const titles = items.map((i) => String(i.title || "")).join(" \n ").toLowerCase();

  if (/(regierung|parlament|wahl|koalition|kanzler|minister)/.test(titles)) {
    eggs.push("a subtle miniature parliament building silhouette as a desk ornament" );
  }

  if (/(eu|brüssel|nato|ukraine|russ|israel|gaza|usa|china)/.test(titles)) {
    eggs.push("a small globe with a few tiny glowing pins (no labels)" );
  }

  eggs.push("a coffee mug with a simple zebra-like pattern (no letters)" );

  return eggs.slice(0, 4);
}

function storyProps(items) {
  return items.slice(0, 6).map((item) => {
    const title = String(item.title || "").toLowerCase();

    // International / geopolitics
    if (/(ukraine|russ|krieg|nato|eu|ungarn|israel|gaza|china|usa)/.test(title)) {
      return "a dedicated panel showing a simplified world map (no labels) with a couple of abstract arrows and pins";
    }

    // Austria domestic politics / economy
    if (/(regierung|parlament|wahl|koalition|budget|mehrwertsteuer|steuer|inflation|preise)/.test(title)) {
      return "a dedicated panel with a simple chart + a document icon + coins (no numbers, no text)";
    }

    // Justice / legal
    if (/(gesetz|gericht|staatsanw|prozess|anzeige)/.test(title)) {
      return "a dedicated panel with a gavel icon and a balanced scale (no text)";
    }

    // Tech/economy trade
    if (/(nvidia|export|handel|chip|industrie)/.test(title)) {
      return "a dedicated panel with a microchip icon and shipping arrows (no text)";
    }

    // Energy / climate
    if (/(klima|wetter|energie|strom|gas)/.test(title)) {
      return "a dedicated panel with clean energy/weather icons (no text)";
    }

    return "a dedicated panel with a neutral abstract breaking-news graphic (no text)";
  });
}

function main() {
  readStdin()
    .then((raw) => {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const eggs = pickEasterEggs(items);
      const props = storyProps(items);

      const prompt = [
        "Cartoony illustration that matches the very distinct ORF ZiB studio look (NOT a generic newsroom).",
        "Camera framing: wide studio shot, anchor centered behind the desk, desk fills the lower half of frame.",
        "Color palette: dominant deep navy/midnight blue and cool cyan/blue lighting, with small crisp red accents. High-tech, clean, minimal.",
        "Set design cues (no logos, no text):",
        "- a large CURVED wraparound video wall backdrop",
        "- the video wall prominently shows a panoramic Earth-from-space horizon band (blue glow) behind the anchor",
        "- vertical LED light columns/panels segmenting the backdrop",
        "- dark glossy reflective floor/riser with subtle blue light strips",
        "Desk design cues:",
        "- large oval/curved anchor desk with a glossy dark (glass-like) top",
        "- white/light-gray geometric base (faceted), with blue underglow",
        "- a thin horizontal red accent line near the desk edge",
        "Lighting: cool studio key light + blue ambient + subtle red rim accents.",
        "Style: 2D cartoon, crisp linework, soft shading, high detail, friendly and delightful.",
        "No text, no logos, no readable UI.",
        "The studio's wraparound video wall MUST clearly reflect the specific news you pulled.",
        "Show 4–6 distinct panels/cards across the wall (one per headline), each with unmistakable symbolic visuals (no words) that correspond to the story:",
        ...props.map((p) => `- ${p}`),
        "Add 3–4 subtle Easter eggs to reward close inspection (no text):",
        ...eggs.map((e) => `- ${e}`),
        "Avoid sports imagery.",
      ].join("\n");

      process.stdout.write(prompt + "\n");
    })
    .catch((err) => {
      process.stderr.write(String(err?.stack ?? err));
      process.stderr.write("\n");
      process.exitCode = 1;
    });
}

main();
