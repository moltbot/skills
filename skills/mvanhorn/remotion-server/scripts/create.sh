#!/bin/bash
# Create a new Remotion project with optional template
# Usage: create.sh <project-name> [--template chat|title|blank]

set -e

PROJECT_NAME=${1:-"my-video"}
TEMPLATE="blank"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --template)
            TEMPLATE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo "🎬 Creating Remotion project: $PROJECT_NAME"
echo "   Template: $TEMPLATE"
echo ""

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize npm
npm init -y > /dev/null 2>&1

# Install Remotion
echo "📦 Installing Remotion..."
npm install --save-exact remotion @remotion/cli @remotion/tailwind > /dev/null 2>&1

# Install dev deps
npm install -D typescript @types/react tailwindcss > /dev/null 2>&1

# Create base structure
mkdir -p src public out

# Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
EOF

# Create remotion.config.ts
cat > remotion.config.ts << 'EOF'
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind";

Config.overrideWebpackConfig((config) => {
  return enableTailwind(config);
});
EOF

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
EOF

# Create index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Apply template
case $TEMPLATE in
    chat)
        cp -r "$TEMPLATES_DIR/chat/"* src/ 2>/dev/null || {
            echo "Creating chat template inline..."
            cat > src/Root.tsx << 'CHATROOT'
import "./index.css";
import { Composition } from "remotion";
import { ChatDemo } from "./ChatDemo";
import messages from "./messages.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChatDemo"
      component={ChatDemo}
      durationInFrames={30 * (messages.length * 2 + 4)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ messages }}
    />
  );
};
CHATROOT
            cat > src/ChatDemo.tsx << 'CHATDEMO'
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

interface Message {
  text: string;
  isUser: boolean;
  emoji?: string;
}

const MessageBubble = ({ text, isUser, delay = 0, emoji }: Message & { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animFrame = frame - delay;

  const opacity = interpolate(animFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const translateY = spring({ frame: animFrame, fps, config: { damping: 15 }, from: 30, to: 0 });

  if (animFrame < 0) return null;

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
      opacity,
      transform: `translateY(${translateY}px)`,
      padding: "0 16px",
    }}>
      {!isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: 20, backgroundColor: "#E53935",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginRight: 8, fontSize: 24,
        }}>🦞</div>
      )}
      <div style={{
        maxWidth: "75%",
        padding: "12px 16px",
        borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
        backgroundColor: isUser ? "#0088cc" : "#E8E8E8",
        color: isUser ? "white" : "black",
        fontSize: 28,
        lineHeight: 1.4,
        whiteSpace: "pre-wrap",
      }}>
        {emoji && <span style={{ marginRight: 8 }}>{emoji}</span>}
        {text}
      </div>
    </div>
  );
};

export const ChatDemo: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "white", fontFamily: "-apple-system, sans-serif" }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "50px 24px 12px", fontSize: 18, fontWeight: 600 }}>
        <span>9:41</span>
        <div style={{ display: "flex", gap: 8 }}>📶 📡 🔋</div>
      </div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E0E0E0", backgroundColor: "#F8F8F8" }}>
        <div style={{ color: "#0088cc", fontSize: 28, marginRight: 12 }}>‹</div>
        <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#E53935", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginRight: 12 }}>🦞</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 22 }}>Lobster</div>
          <div style={{ fontSize: 16, color: "#888" }}>online</div>
        </div>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, padding: "20px 0" }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} delay={i * 40 + 30} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
CHATDEMO
            cat > src/messages.json << 'MESSAGES'
[
  { "text": "What's the battery level?", "isUser": true },
  { "text": "🔋 Battery: 67% (175 mi)\n⚡ Charging: Disconnected\n🌡️ Inside: 44°F", "isUser": false },
  { "text": "Unlock the car", "isUser": true },
  { "text": "🔓 Car unlocked!", "isUser": false, "emoji": "🚗" },
  { "text": "Turn on defrost", "isUser": true },
  { "text": "🔥 Max defrost ON", "isUser": false }
]
MESSAGES
        }
        ;;
    title)
        cat > src/Root.tsx << 'TITLEROOT'
import "./index.css";
import { Composition } from "remotion";
import { TitleCard } from "./TitleCard";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TitleCard"
      component={TitleCard}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ title: "Your Title Here", subtitle: "Subtitle text" }}
    />
  );
};
TITLEROOT
        cat > src/TitleCard.tsx << 'TITLECARD'
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

export const TitleCard: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, from: 0.8, to: 1 });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      backgroundColor: "#1a1a2e",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: `scale(${scale})`,
    }}>
      <div style={{ fontSize: 96, fontWeight: 800, color: "white", textAlign: "center", marginBottom: 20 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 36, color: "#888", textAlign: "center" }}>
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
TITLECARD
        ;;
    *)
        # Blank template
        cat > src/Root.tsx << 'BLANKROOT'
import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
BLANKROOT
        cat > src/Composition.tsx << 'BLANKCOMP'
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{
      backgroundColor: "#1a1a2e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ fontSize: 72, color: "white" }}>
        Frame {frame}
      </div>
    </AbsoluteFill>
  );
};
BLANKCOMP
        ;;
esac

# Create index.ts
cat > src/index.ts << 'EOF'
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
EOF

echo ""
echo "✅ Project created: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npx remotion preview    # Preview in browser"
echo "  npx remotion render ChatDemo out/video.mp4   # Render"
