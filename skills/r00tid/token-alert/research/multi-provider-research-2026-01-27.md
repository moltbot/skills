# Multi-Provider Token Tracking Research Report
**Date:** 2026-01-27 04:00 CET  
**Research Duration:** Deep dive into OpenAI & Gemini API usage tracking  
**Status:** ✅ Complete

---

## Executive Summary

**Key Findings:**
- **OpenAI**: Comprehensive Usage API with granular tracking (✅ Production-ready)
- **Gemini**: Standard quota/usage endpoints available (✅ Production-ready)
- **Integration Complexity**: Medium (OpenAI: 5/10, Gemini: 6/10, Multi-Provider: 7/10)
- **Recommendation**: **GO** - Both providers have solid APIs, multi-provider architecture is feasible

**Bottom Line:** Implementing multi-provider token tracking is viable with ~2-3 weeks of effort for a production-grade solution.

---

## 1. OpenAI Usage Tracking

### API Endpoints

OpenAI provides a comprehensive Usage API with multiple endpoints:

#### Base URL
```
https://api.openai.com/v1/organization/usage/
```

#### Available Endpoints:
- `/completions` - Text generation token usage
- `/embeddings` - Embedding token usage
- `/moderations` - Moderation API usage
- `/images` - Image generation usage
- `/audio_speeches` - TTS character usage
- `/audio_transcriptions` - STT seconds usage
- `/vector_stores` - Vector store storage usage
- `/code_interpreter_sessions` - Code interpreter sessions
- `/costs` - **Financial costs** (reconciles with billing)

#### Authentication
```bash
curl "https://api.openai.com/v1/organization/usage/completions?start_time=1730419200" \
  -H "Authorization: Bearer $OPENAI_ADMIN_KEY"
```

### Query Parameters

**Time Range:**
- `start_time` (required) - Unix timestamp, inclusive
- `end_time` (optional) - Unix timestamp, exclusive
- `bucket_width` - `1m`, `1h`, or `1d` (default: `1d`)

**Grouping & Filtering:**
- `group_by[]` - Array of: `project_id`, `user_id`, `api_key_id`, `model`, `batch`, `service_tier`
- `project_ids[]`, `user_ids[]`, `api_key_ids[]`, `models[]` - Filter by specific values
- `limit` - Buckets to return (max depends on bucket_width)
- `page` - Pagination cursor

### Response Structure

```json
{
  "object": "page",
  "data": [
    {
      "object": "bucket",
      "start_time": 1730419200,
      "end_time": 1730505600,
      "results": [
        {
          "object": "organization.usage.completions.result",
          "input_tokens": 1000,
          "output_tokens": 500,
          "input_cached_tokens": 800,
          "input_audio_tokens": 0,
          "output_audio_tokens": 0,
          "num_model_requests": 5,
          "project_id": null,
          "user_id": null,
          "api_key_id": null,
          "model": null,
          "batch": null,
          "service_tier": null
        }
      ]
    }
  ],
  "has_more": true,
  "next_page": "page_AAAAAGdGxdEiJdKOAAAAAGcqsYA="
}
```

### Rate Limits & Token Budgets

**Rate Limits:**
- Returned in HTTP response headers:
  - `x-ratelimit-limit-requests`
  - `x-ratelimit-remaining-requests`
  - `x-ratelimit-reset-requests`
  - `x-ratelimit-limit-tokens`
  - `x-ratelimit-remaining-tokens`
  - `x-ratelimit-reset-tokens`

**Budget Management:**
- **Usage Tier System:** Free, Tier 1-5 based on spend
- **Organization Limits:** Set in account dashboard
- **Project-level Limits:** Can be set per project
- **Email Alerts:** Configure threshold notifications in account settings

### Monitoring Options

1. **Dashboard:** https://platform.openai.com/usage
   - Visual charts by date, model, endpoint
   - Cost breakdowns
   - Export to CSV

2. **API Monitoring:**
   - Real-time via response headers
   - Historical via Usage API
   - Costs API for financial reconciliation

3. **Webhooks:** Not directly supported, must poll Usage API

**Integration Complexity: 5/10**
- ✅ Well-documented API
- ✅ Comprehensive data granularity
- ✅ Separate costs endpoint
- ⚠️ Requires admin-level API key
- ⚠️ No real-time webhooks (polling required)

---

## 2. Gemini Usage Tracking

### API Endpoints

Google Gemini provides usage tracking through the Generative Language API:

#### Base URL
```
https://generativelanguage.googleapis.com/v1beta/
```

#### Available Endpoints:
- `models/{model}:countTokens` - Count tokens before request
- `models/{model}:generateContent` - Returns usage in response
- `tunedModels/{tunedModel}:generateContent` - Tuned model usage

#### Authentication
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}'
```

### Usage Data in Response

Every Gemini API response includes usage metadata:

```json
{
  "candidates": [...],
  "usageMetadata": {
    "promptTokenCount": 150,
    "candidatesTokenCount": 300,
    "totalTokenCount": 450,
    "cachedContentTokenCount": 0
  }
}
```

### Historical Usage Tracking

**Google Cloud Console:**
- Navigate to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- Shows quota usage by:
  - Requests per minute (RPM)
  - Requests per day (RPD)
  - Tokens per minute (TPM)
  - By model

**Note:** Unlike OpenAI, Gemini doesn't have a dedicated historical usage API. You must:
1. Track usage client-side from response metadata
2. Use Google Cloud Monitoring/Logging (requires Cloud project)
3. Query Cloud Billing API for costs

### Rate Limits & Quotas

**Free Tier:**
- 15 RPM (Requests per minute)
- 1,500 RPD (Requests per day)
- 1 million TPM (Tokens per minute)
- 4 million TPD (Tokens per day)

**Paid Tier (Pay-as-you-go):**
- 2,000 RPM
- 20,000+ RPD
- Higher TPM/TPD limits

**Rate Limit Headers:**
- Not consistently returned in responses
- Must rely on error responses (HTTP 429)

### Monitoring Options

1. **Per-Request Tracking:**
   - Parse `usageMetadata` from every response
   - Store locally or in database

2. **Google Cloud Console:**
   - Quota dashboard (near real-time)
   - Cloud Logging (if project enabled)
   - Cloud Billing reports

3. **countTokens Endpoint:**
   - Pre-flight token estimation
   - Useful for budget checks before requests

**Integration Complexity: 6/10**
- ✅ Usage data in every response
- ✅ countTokens for pre-flight checks
- ⚠️ No dedicated historical usage API
- ⚠️ Must implement client-side tracking
- ⚠️ Rate limit info not in headers
- ⚠️ Cloud Console requires GCP project setup

---

## 3. Existing Libraries/Tools

### Open Source Projects

#### 1. **LangChain / LangSmith**
- **URL:** https://www.langchain.com/langsmith
- **Features:**
  - Multi-provider tracking (OpenAI, Anthropic, Google, etc.)
  - Built-in usage monitoring
  - Cost tracking
  - Tracing & debugging
- **Pros:** Battle-tested, comprehensive
- **Cons:** Heavyweight, requires LangSmith account for hosted features
- **Integration:** High complexity (full framework adoption)

#### 2. **LiteLLM**
- **URL:** https://github.com/BerriAI/litellm
- **Features:**
  - Unified API across 100+ LLMs
  - Built-in token counting & cost tracking
  - Usage tracking & budgets
  - Proxy mode with Redis caching
- **Pros:** Lightweight, drop-in replacement, great docs
- **Cons:** Another dependency layer
- **Integration:** Medium complexity
- **Example:**
```python
from litellm import completion, token_counter

response = completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
    metadata={"user": "user_123"}  # For tracking
)

# Access usage
print(response.usage)  # {"prompt_tokens": 10, "completion_tokens": 20}

# Calculate cost
from litellm import cost_per_token
cost = cost_per_token("gpt-4", prompt_tokens=10, completion_tokens=20)
```

#### 3. **OpenLLMetry**
- **URL:** https://github.com/traceloop/openllmetry
- **Features:**
  - OpenTelemetry-based LLM observability
  - Tracks tokens, costs, latency
  - Exports to Grafana, Prometheus, etc.
- **Pros:** Open standards (OTel), good for existing monitoring stacks
- **Cons:** Requires OTel infrastructure
- **Integration:** Medium-High complexity

#### 4. **Helicone**
- **URL:** https://www.helicone.ai/
- **Features:**
  - LLM observability platform
  - Usage, cost, latency tracking
  - Multi-provider support
- **Pros:** Beautiful UI, easy setup
- **Cons:** Hosted service (privacy concerns), free tier limits
- **Integration:** Low-Medium complexity (proxy mode)

#### 5. **Roll-Your-Own with Tiktoken**
- **tiktoken:** OpenAI's official token counter
- **Example:**
```python
import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4")
tokens = encoding.encode("Hello, world!")
print(len(tokens))  # 4
```
- **Pros:** Accurate, lightweight, official
- **Cons:** OpenAI-specific, no Gemini support out of box
- **Gemini:** Use `countTokens` endpoint or `google.generativeai.count_tokens()`

### Recommendation: **LiteLLM** for quick wins, **Roll-Your-Own** for full control

---

## 4. Integration Complexity (Skala 1-10)

### OpenAI Integration: **5/10**
- **Effort:** ~3-5 days
- **Why 5/10:**
  - ✅ Excellent documentation
  - ✅ Comprehensive API
  - ✅ Costs endpoint for financial data
  - ⚠️ Polling required (no webhooks)
  - ⚠️ Admin key needed for org-level data
  - ⚠️ Response pagination for large orgs

### Gemini Integration: **6/10**
- **Effort:** ~5-7 days
- **Why 6/10:**
  - ⚠️ No historical usage API
  - ⚠️ Must implement client-side tracking
  - ⚠️ Rate limits not in response headers
  - ✅ Usage in every response (easy to capture)
  - ✅ countTokens for pre-flight checks
  - ⚠️ Google Cloud setup for advanced monitoring

### Multi-Provider Architecture: **7/10**
- **Effort:** ~2-3 weeks
- **Why 7/10:**
  - ⚠️ Different data models (OpenAI granular, Gemini per-response)
  - ⚠️ Unified storage schema required
  - ⚠️ Cost calculation differs per provider
  - ⚠️ Rate limit handling varies
  - ✅ Patterns are similar (REST APIs, JSON)
  - ✅ Libraries like LiteLLM can abstract some complexity

---

## 5. Tracking-Ansätze: Vor- und Nachteile

### Lokal: Browser-based Tracking

**Architecture:**
```
Browser Extension → Local Storage → IndexedDB
```

**Pros:**
- ✅ No server required
- ✅ Privacy: Data stays local
- ✅ Fast: No network latency
- ✅ Works offline

**Cons:**
- ❌ Browser-specific (no mobile, no CLI tracking)
- ❌ No cross-device sync
- ❌ Limited storage (IndexedDB ~50MB per origin)
- ❌ Can't track server-side API calls
- ❌ Users can clear browser data

**Use Case:** Personal dashboards, single-user tools, Chrome extension

---

### API-based: Server-side Tracking

**Architecture:**
```
App → Your Backend API → Database → Dashboard
           ↓
     Provider APIs (OpenAI/Gemini)
```

**Pros:**
- ✅ Centralized data
- ✅ Cross-device, multi-user
- ✅ Historical data retention
- ✅ Advanced analytics
- ✅ Tracks all usage (web, mobile, API)

**Cons:**
- ❌ Requires server infrastructure
- ❌ Database setup & maintenance
- ❌ Privacy considerations (data stored externally)
- ❌ Network dependency
- ❌ Higher complexity

**Use Case:** Production apps, multi-user platforms, enterprise

---

### Hybrid: Kombination

**Architecture:**
```
App → Local Cache (IndexedDB) → Sync to Backend (batched)
           ↓
     Provider APIs
```

**Pros:**
- ✅ Works offline
- ✅ Fast local reads
- ✅ Centralized backup/analytics
- ✅ Resilient to network issues

**Cons:**
- ❌ Most complex implementation
- ❌ Sync conflicts possible
- ❌ Two storage layers to maintain

**Use Case:** Progressive Web Apps, apps with offline mode

---

### Recommendation by Use Case:

| Use Case | Approach | Why |
|----------|----------|-----|
| **Personal Tool** | Local | Simple, private, no infrastructure |
| **Clawdbot Extension** | Hybrid | Offline + sync to gateway |
| **SaaS Product** | API-based | Multi-user, analytics, compliance |
| **Enterprise** | API-based | Audit trails, reporting, multi-tenant |

---

## 6. Architektur-Empfehlung

### Best Practices für Multi-Provider Token Tracking

#### 1. **Abstraction Layer (Provider Interface)**

Create a unified interface:

```typescript
interface ProviderUsageTracker {
  trackRequest(request: APIRequest): void;
  trackResponse(response: APIResponse): UsageData;
  getUsage(filters: UsageFilter): Promise<UsageReport>;
  calculateCost(usage: UsageData): number;
}

interface UsageData {
  provider: 'openai' | 'gemini' | 'anthropic';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  cost: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}
```

#### 2. **Code Structure**

```
src/
├── providers/
│   ├── base.ts              # Abstract base class
│   ├── openai.ts            # OpenAI implementation
│   ├── gemini.ts            # Gemini implementation
│   └── anthropic.ts         # Claude implementation
├── storage/
│   ├── local.ts             # IndexedDB for browser
│   ├── database.ts          # PostgreSQL/MongoDB for server
│   └── sync.ts              # Hybrid sync logic
├── analytics/
│   ├── aggregator.ts        # Roll-up usage by day/week/month
│   ├── cost-calculator.ts   # Provider-specific pricing
│   └── reporter.ts          # Generate usage reports
├── dashboard/
│   ├── components/          # React/Vue components
│   └── api.ts               # Dashboard API endpoints
└── utils/
    ├── token-counter.ts     # Tiktoken, etc.
    └── rate-limiter.ts      # Rate limit tracking
```

#### 3. **State Management Patterns**

**Event-Driven Architecture:**

```typescript
// Emit events on API calls
eventBus.on('api:request', (event) => {
  usageTracker.trackRequest(event.request);
});

eventBus.on('api:response', (event) => {
  const usage = usageTracker.trackResponse(event.response);
  storage.save(usage);
  dashboard.update(usage);
});

// Aggregate periodically
cron.schedule('0 * * * *', async () => {
  const hourlyUsage = await aggregator.rollup('hour');
  await storage.saveAggregated(hourlyUsage);
});
```

**Middleware Pattern (for API proxies):**

```typescript
async function usageTrackingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Intercept response
  const originalSend = res.send;
  res.send = function(data) {
    const usage = extractUsage(req, data);
    usage.latency = Date.now() - startTime;
    
    usageTracker.track(usage);
    
    return originalSend.call(this, data);
  };
  
  next();
}

app.use('/api/openai/*', usageTrackingMiddleware);
app.use('/api/gemini/*', usageTrackingMiddleware);
```

#### 4. **Database Schema (PostgreSQL Example)**

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  session_id VARCHAR(100),
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  cached_tokens INT DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL,
  latency_ms INT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_usage_events_timestamp ON usage_events(timestamp);
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_provider ON usage_events(provider);

-- Aggregated table for fast queries
CREATE TABLE usage_aggregates (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  date DATE NOT NULL,
  hour INT,  -- NULL for daily aggregates
  total_tokens BIGINT NOT NULL,
  total_cost_usd DECIMAL(12, 4) NOT NULL,
  request_count INT NOT NULL,
  UNIQUE(provider, model, user_id, date, hour)
);
```

---

## 7. Code-Beispiele

### OpenAI API Usage Query (Node.js)

```javascript
const https = require('https');

async function getOpenAIUsage() {
  const now = Math.floor(Date.now() / 1000);
  const yesterday = now - 86400;
  
  const options = {
    hostname: 'api.openai.com',
    path: `/v1/organization/usage/completions?start_time=${yesterday}&end_time=${now}&bucket_width=1h&group_by[]=model`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_ADMIN_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Usage
getOpenAIUsage().then(usage => {
  console.log('Last 24h usage by model:');
  usage.data.forEach(bucket => {
    bucket.results.forEach(result => {
      console.log(`${result.model}: ${result.total_tokens} tokens, ${result.num_model_requests} requests`);
    });
  });
});
```

---

### Gemini API Usage Query (Node.js)

**Note:** Gemini doesn't have historical usage API, so this tracks per-request:

```javascript
const fetch = require('node-fetch');

async function queryGeminiWithTracking(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  
  // Extract usage metadata
  const usage = data.usageMetadata;
  
  // Store usage (your implementation)
  await storeUsage({
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    promptTokens: usage.promptTokenCount,
    completionTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
    cachedTokens: usage.cachedContentTokenCount || 0,
    cost: calculateGeminiCost(usage),  // Your pricing function
    timestamp: new Date()
  });

  return data;
}

function calculateGeminiCost(usage) {
  // Gemini 2.0 Flash pricing (example)
  const COST_PER_1K_INPUT = 0.00001875;   // $0.01875 per 1M tokens
  const COST_PER_1K_OUTPUT = 0.000075;    // $0.075 per 1M tokens
  
  return (
    (usage.promptTokenCount / 1000000) * COST_PER_1K_INPUT +
    (usage.candidatesTokenCount / 1000000) * COST_PER_1K_OUTPUT
  );
}

// Usage tracking storage (example with local JSON file)
const fs = require('fs').promises;

async function storeUsage(usage) {
  const logFile = './usage-log.jsonl';
  await fs.appendFile(logFile, JSON.stringify(usage) + '\n');
}
```

---

### Dashboard Integration Beispiel (React)

```typescript
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

interface UsageData {
  date: string;
  openai: number;
  gemini: number;
  cost: number;
}

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    const res = await fetch('/api/usage?days=30');
    const data = await res.json();
    setUsage(data);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  const chartData = {
    labels: usage.map(d => d.date),
    datasets: [
      {
        label: 'OpenAI Tokens',
        data: usage.map(d => d.openai),
        borderColor: 'rgb(16, 163, 127)',
        backgroundColor: 'rgba(16, 163, 127, 0.1)',
      },
      {
        label: 'Gemini Tokens',
        data: usage.map(d => d.gemini),
        borderColor: 'rgb(66, 133, 244)',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
      }
    ]
  };

  const totalCost = usage.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="dashboard">
      <h1>Token Usage - Last 30 Days</h1>
      
      <div className="summary">
        <div className="card">
          <h3>Total Cost</h3>
          <p className="value">${totalCost.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>OpenAI Tokens</h3>
          <p className="value">{usage.reduce((s, d) => s + d.openai, 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Gemini Tokens</h3>
          <p className="value">{usage.reduce((s, d) => s + d.gemini, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="chart">
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Token Usage Over Time' }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }} />
      </div>
    </div>
  );
}
```

**Backend API Endpoint:**

```typescript
// /api/usage endpoint (Express.js)
app.get('/api/usage', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  const usage = await db.query(`
    SELECT 
      date,
      SUM(CASE WHEN provider = 'openai' THEN total_tokens ELSE 0 END) as openai,
      SUM(CASE WHEN provider = 'gemini' THEN total_tokens ELSE 0 END) as gemini,
      SUM(cost_usd) as cost
    FROM usage_aggregates
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY date
    ORDER BY date ASC
  `);
  
  res.json(usage.rows);
});
```

---

## 8. Aufwands-Schätzung

### Phase 1: Proof of Concept (1 week)
- [ ] Basic OpenAI usage tracking (2 days)
- [ ] Basic Gemini per-request tracking (2 days)
- [ ] Simple dashboard with mock data (2 days)
- [ ] Cost calculation logic (1 day)

### Phase 2: Production MVP (2 weeks)
- [ ] Provider abstraction layer (3 days)
- [ ] Database schema + migrations (2 days)
- [ ] Middleware/interceptor implementation (3 days)
- [ ] Real-time dashboard (React/Vue) (4 days)
- [ ] Testing + bug fixes (2 days)

### Phase 3: Advanced Features (1-2 weeks)
- [ ] User-level tracking & quotas (2 days)
- [ ] Budget alerts (email/webhook) (2 days)
- [ ] Export to CSV/JSON (1 day)
- [ ] Analytics & insights (model comparison, cost optimization) (3 days)
- [ ] Rate limit handling & retry logic (2 days)

**Total Effort:** 4-5 weeks for full production-grade system with one developer.

---

## 9. Empfehlungen (Go/No-Go)

### OpenAI Integration: ✅ **GO**
- **Why GO:**
  - Mature, well-documented API
  - Granular usage data
  - Separate costs endpoint (financial accuracy)
  - Large community & examples
- **When NOT to go:**
  - Only need real-time tracking (Usage API is historical)
  - Don't have admin-level API key access

---

### Gemini Integration: ✅ **GO (with caveats)**
- **Why GO:**
  - Usage metadata in every response (easy to capture)
  - countTokens for pre-flight checks
  - Growing ecosystem
- **Caveats:**
  - Must implement client-side tracking (no historical API)
  - Rate limits less transparent
  - Requires more infrastructure (storage, aggregation)
- **When NOT to go:**
  - Need out-of-the-box historical API
  - Can't implement local tracking

---

### Multi-Provider Architecture: ✅ **GO**
- **Why GO:**
  - Future-proof: Easy to add Anthropic, Cohere, etc.
  - Unified view across providers
  - Cost optimization opportunities
- **When NOT to go:**
  - Only using one provider (YAGNI)
  - Team size < 2 (overhead might not be worth it for solo dev)

---

## 10. Quick Wins & Next Steps

### Quick Win #1: LiteLLM Integration (1-2 days)
Instead of building from scratch, use LiteLLM:

```bash
npm install litellm-proxy
```

```python
# proxy_server.py
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "sk-..."
os.environ["GEMINI_API_KEY"] = "..."

# LiteLLM automatically tracks usage
response = completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
    metadata={"user": "user_123"}
)

print(response.usage)  # {"prompt_tokens": 5, "completion_tokens": 10}
```

Start LiteLLM proxy:
```bash
litellm --config config.yaml  # Built-in dashboard at http://localhost:4000
```

**Pros:** Immediate usage tracking, built-in UI, minimal code.

---

### Quick Win #2: Clawdbot Extension (Browser-Only) (3-5 days)
For personal use, build a Chrome extension:

1. Intercept API calls via `chrome.webRequest`
2. Parse responses, extract usage
3. Store in IndexedDB
4. Display in popup dashboard

**Pros:** No backend needed, works immediately, private.

---

### Next Steps:
1. **Decision:** Local (browser) vs. Server-side architecture?
2. **Spike:** Test LiteLLM proxy (1 day) - might solve 80% of the problem
3. **POC:** Build minimal dashboard with hardcoded data (2 days)
4. **Iterate:** Add real provider integration once POC validated

---

## Conclusion

Multi-provider token tracking is **feasible and recommended**. Both OpenAI and Gemini provide sufficient APIs, though with different approaches:

- **OpenAI:** Historical usage via dedicated API (easier)
- **Gemini:** Per-request metadata (requires client tracking)

**Recommended Path:**
1. Start with **LiteLLM** for quick validation (1-2 days)
2. If needs are simple → stick with LiteLLM + its dashboard
3. If needs are complex (custom analytics, multi-tenant, etc.) → build custom multi-provider architecture (~4 weeks)

**The juice is worth the squeeze** if you're serious about cost optimization and usage visibility across providers.

---

**Research Complete** ✅  
*Generated: 2026-01-27 04:00 CET*
