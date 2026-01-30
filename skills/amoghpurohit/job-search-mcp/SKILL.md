---
name: Job Search MCP
description: Search for jobs across LinkedIn, Indeed, Glassdoor, ZipRecruiter, Google Jobs, Bayt, Naukri, and BDJobs using the JobSpy MCP server.
slug: job-search-mcp
tags:
  - job-search
  - career
  - mcp
  - jobspy
---
# Job Search MCP Skill

This skill enables AI agents to search for jobs across multiple job boards using the **JobSpy MCP Server**. JobSpy aggregates job listings from LinkedIn, Indeed, Glassdoor, ZipRecruiter, Google Jobs, Bayt, Naukri, and BDJobs into a unified interface.

## When to Use This Skill

Use this skill when the user asks you to:
- Find job listings matching specific criteria (role, location, company, etc.)
- Search for remote or on-site positions
- Compare job opportunities across different platforms
- Get salary information for job postings
- Find recently posted jobs (within X hours)
- Search for jobs with "Easy Apply" options

## Prerequisites

- **Python 3.10+**
- **Node.js 16+** (for some server implementations)
- The JobSpy MCP server installed and configured

---

## Installation & Setup

### Option 1: Python MCP Server (Recommended)

```bash
# Install with pip
pip install mcp>=1.1.0 python-jobspy>=1.1.82 pandas>=2.1.0 pydantic>=2.0.0

# Or install with uv (faster)
uv add mcp python-jobspy pandas pydantic
```

### Option 2: Clone a Pre-built Server

```bash
# Clone the jobspy-mcp-server repository
git clone https://github.com/chinpeerapat/jobspy-mcp-server.git
cd jobspy-mcp-server

# Install dependencies
uv sync
# or
pip install -e .
```

### Claude Desktop Configuration

Add the following to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "jobspy": {
      "command": "uv",
      "args": ["run", "jobspy-mcp-server"],
      "env": {}
    }
  }
}
```

**Alternative configuration (Node.js server):**

```json
{
  "mcpServers": {
    "jobspy": {
      "command": "node",
      "args": ["/path/to/jobspy-mcp-server/src/index.js"],
      "env": {
        "ENABLE_SSE": "0"
      }
    }
  }
}
```

---

## MCP Tool Schemas

### 1. `scrape_jobs_tool` (Primary Tool)

Search for jobs across multiple job boards with comprehensive filtering.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search_term` | string | ✅ Yes | - | Job keywords (e.g., "software engineer", "data scientist") |
| `location` | string | No | - | Job location (e.g., "San Francisco, CA", "Remote") |
| `site_name` | array | No | `["indeed", "linkedin", "zip_recruiter", "google"]` | Job boards to search |
| `results_wanted` | integer | No | 15 | Number of results (1-1000) |
| `job_type` | string | No | - | Employment type: `fulltime`, `parttime`, `internship`, `contract` |
| `is_remote` | boolean | No | false | Filter for remote jobs only |
| `hours_old` | integer | No | - | Filter by posting recency in hours |
| `distance` | integer | No | 50 | Search radius in miles (1-100) |
| `easy_apply` | boolean | No | false | Filter jobs with easy apply option |
| `country_indeed` | string | No | "usa" | Country for Indeed/Glassdoor searches |
| `linkedin_fetch_description` | boolean | No | false | Fetch full LinkedIn descriptions (slower) |
| `offset` | integer | No | 0 | Pagination offset |
| `verbose` | integer | No | 1 | Logging level (0=errors, 1=warnings, 2=all) |

**Supported Values for `site_name`:**
- `linkedin` - Professional networking platform (rate limited)
- `indeed` - Largest job search engine (most reliable)
- `glassdoor` - Jobs with company reviews and salaries
- `zip_recruiter` - Job matching for US/Canada
- `google` - Aggregated job listings
- `bayt` - Middle East job portal
- `naukri` - India's leading job portal
- `bdjobs` - Bangladesh job portal

**Supported Values for `job_type`:**
- `fulltime`
- `parttime`
- `internship`
- `contract`

### 2. `get_supported_countries`

Returns the complete list of supported countries for job searches. No parameters required.

### 3. `get_supported_sites`

Returns detailed information about all supported job board sites. No parameters required.

### 4. `get_job_search_tips`

Returns tips and best practices for effective job searching. No parameters required.

---

## Job Post Response Schema

When jobs are returned, each job post contains the following fields:

```typescript
interface JobPost {
  // Core fields (all platforms)
  title: string;                    // Job title
  company: string;                  // Company name
  company_url?: string;             // Company website URL
  job_url: string;                  // Direct link to job posting
  location: {
    country?: string;
    city?: string;
    state?: string;
  };
  is_remote: boolean;               // Whether job is remote
  description?: string;             // Job description (markdown format)
  job_type?: "fulltime" | "parttime" | "internship" | "contract";
  
  // Salary information
  salary?: {
    interval?: "yearly" | "monthly" | "weekly" | "daily" | "hourly";
    min_amount?: number;
    max_amount?: number;
    currency?: string;
    salary_source?: "direct_data" | "description";  // Parsed from posting
  };
  
  date_posted?: string;             // ISO date string
  emails?: string[];                // Contact emails if available
  
  // LinkedIn specific
  job_level?: string;               // Seniority level
  
  // LinkedIn & Indeed specific
  company_industry?: string;
  
  // Indeed specific
  company_country?: string;
  company_addresses?: string[];
  company_employees_label?: string;
  company_revenue_label?: string;
  company_description?: string;
  company_logo?: string;
  
  // Naukri specific
  skills?: string[];
  experience_range?: string;
  company_rating?: number;
  company_reviews_count?: number;
  vacancy_count?: number;
  work_from_home_type?: string;
}
```

---

## Example Prompts → MCP Calls → Outputs

### Example 1: Basic Job Search

**User Prompt:**
> "Find me 10 software engineer jobs in San Francisco"

**MCP Tool Call:**
```json
{
  "tool": "scrape_jobs_tool",
  "params": {
    "search_term": "software engineer",
    "location": "San Francisco, CA",
    "results_wanted": 10,
    "site_name": ["indeed", "linkedin"]
  }
}
```

**Expected Output:**
```json
{
  "jobs": [
    {
      "title": "Software Engineer",
      "company": "TechCorp Inc.",
      "location": { "city": "San Francisco", "state": "CA" },
      "job_url": "https://indeed.com/viewjob?jk=abc123",
      "salary": { "min_amount": 120000, "max_amount": 180000, "interval": "yearly" },
      "job_type": "fulltime",
      "is_remote": false
    }
    // ... more jobs
  ],
  "total_found": 10
}
```

---

### Example 2: Remote Jobs Search

**User Prompt:**
> "Search for remote Python developer positions from Indeed and ZipRecruiter"

**MCP Tool Call:**
```json
{
  "tool": "scrape_jobs_tool",
  "params": {
    "search_term": "Python developer",
    "location": "Remote",
    "is_remote": true,
    "site_name": ["indeed", "zip_recruiter"],
    "results_wanted": 20
  }
}
```

---

### Example 3: Recent Jobs with Filters

**User Prompt:**
> "Find data scientist jobs in Boston posted in the last 24 hours"

**MCP Tool Call:**
```json
{
  "tool": "scrape_jobs_tool",
  "params": {
    "search_term": "data scientist",
    "location": "Boston, MA",
    "hours_old": 24,
    "site_name": ["linkedin", "glassdoor", "indeed"],
    "linkedin_fetch_description": true
  }
}
```

---

### Example 4: Entry-Level with Easy Apply

**User Prompt:**
> "Look for entry-level marketing jobs in New York with easy apply options"

**MCP Tool Call:**
```json
{
  "tool": "scrape_jobs_tool",
  "params": {
    "search_term": "junior marketing",
    "location": "New York, NY",
    "job_type": "fulltime",
    "easy_apply": true,
    "site_name": ["indeed", "zip_recruiter"],
    "results_wanted": 30
  }
}
```

---

### Example 5: International Job Search

**User Prompt:**
> "Find software jobs in Germany on Indeed"

**MCP Tool Call:**
```json
{
  "tool": "scrape_jobs_tool",
  "params": {
    "search_term": "software developer",
    "location": "Berlin",
    "country_indeed": "germany",
    "site_name": ["indeed"],
    "results_wanted": 15
  }
}
```

---

### Example 6: Getting Helper Information

**User Prompt:**
> "What job sites are supported?"

**MCP Tool Call:**
```json
{
  "tool": "get_supported_sites",
  "params": {}
}
```

**Expected Output:**
```json
{
  "sites": [
    { "name": "indeed", "description": "Largest job search engine, most reliable" },
    { "name": "linkedin", "description": "Professional networking platform, rate limited" },
    { "name": "glassdoor", "description": "Jobs with company reviews and salaries" },
    { "name": "zip_recruiter", "description": "Job matching for US/Canada" },
    { "name": "google", "description": "Aggregated job listings" },
    { "name": "bayt", "description": "Middle East job portal" },
    { "name": "naukri", "description": "India's leading job portal" },
    { "name": "bdjobs", "description": "Bangladesh job portal" }
  ]
}
```

---

## Error Handling Examples

### Error 1: Rate Limiting

**Scenario:** LinkedIn returns a rate limit error.

**Error Response:**
```json
{
  "error": "RateLimitError",
  "message": "LinkedIn rate limit exceeded. Try again later or use different sites.",
  "suggestion": "Switch to Indeed or ZipRecruiter which have more lenient rate limits."
}
```

**How to Handle:**
- Reduce `results_wanted` to a smaller number (10-15)
- Remove `linkedin` from `site_name` temporarily
- Add delays between searches
- Use proxy configuration if available

---

### Error 2: No Results Found

**Scenario:** Search returns empty results.

**Error Response:**
```json
{
  "jobs": [],
  "total_found": 0,
  "message": "No jobs found matching your criteria"
}
```

**How to Handle:**
- Broaden search terms (e.g., "engineer" instead of "senior principal software engineer")
- Increase `distance` radius
- Remove restrictive filters like `hours_old` or `job_type`
- Try different `site_name` options
- Check if location spelling is correct

---

### Error 3: Invalid Country Code

**Scenario:** User specifies an unsupported country for Indeed.

**Error Response:**
```json
{
  "error": "ValidationError",
  "message": "Invalid country_indeed value. Use get_supported_countries to see valid options."
}
```

**How to Handle:**
- Call `get_supported_countries` to get valid country codes
- Use the exact country name (e.g., "usa" not "US", "united kingdom" not "UK")

---

### Error 4: Platform-Specific Limitation Conflict

**Scenario:** User tries to use conflicting filters.

**Known Limitations:**
- **Indeed:** Only ONE of these can be used: `hours_old`, `job_type & is_remote`, `easy_apply`
- **LinkedIn:** Only ONE of these can be used: `hours_old`, `easy_apply`

**How to Handle:**
- Inform user of the limitation
- Prioritize the most important filter
- Run separate searches if multiple filters are needed

---

## Anti-Patterns (What NOT to Do)

### ❌ DO NOT: Request Excessive Results

```json
// BAD - Will likely timeout or get rate limited
{
  "search_term": "engineer",
  "results_wanted": 1000,
  "site_name": ["linkedin", "indeed", "glassdoor", "zip_recruiter", "google"]
}
```

**Why:** Requesting too many results from too many sites simultaneously will trigger rate limits and cause timeouts.

**✅ DO INSTEAD:**
```json
{
  "search_term": "software engineer",
  "results_wanted": 20,
  "site_name": ["indeed", "linkedin"]
}
```

---

### ❌ DO NOT: Use LinkedIn Extensively

```json
// BAD - LinkedIn is heavily rate limited
{
  "search_term": "developer",
  "site_name": ["linkedin"],
  "results_wanted": 100,
  "linkedin_fetch_description": true
}
```

**Why:** LinkedIn has the strictest rate limits. Using `linkedin_fetch_description: true` multiplies requests.

**✅ DO INSTEAD:**
- Use Indeed as primary source
- Limit LinkedIn to 10-15 results
- Only enable `linkedin_fetch_description` when specifically needed

---

### ❌ DO NOT: Use Conflicting Filters

```json
// BAD - Indeed limitation: only one filter group allowed
{
  "search_term": "developer",
  "site_name": ["indeed"],
  "hours_old": 24,
  "job_type": "fulltime",
  "is_remote": true
}
```

**Why:** Indeed only supports one of: `hours_old`, `job_type & is_remote`, or `easy_apply`.

**✅ DO INSTEAD:**
```json
// Either filter by recency
{
  "search_term": "developer",
  "site_name": ["indeed"],
  "hours_old": 24
}

// OR filter by job type
{
  "search_term": "developer",
  "site_name": ["indeed"],
  "job_type": "fulltime",
  "is_remote": true
}
```

---

### ❌ DO NOT: Make Vague Searches Without Context

```json
// BAD - Too generic, will return irrelevant results
{
  "search_term": "job"
}
```

**Why:** Vague searches return poor quality results and waste API calls.

**✅ DO INSTEAD:**
- Always include specific job titles or skills
- Include location when known
- Use filters to narrow results

---

### ❌ DO NOT: Ignore Error Responses

**Why:** Rate limits, network issues, and invalid parameters require appropriate handling.

**✅ DO INSTEAD:**
- Check for error responses before processing results
- Implement retry logic with backoff for rate limits
- Provide helpful messages to users when searches fail

---

### ❌ DO NOT: Use Wrong Country Codes

```json
// BAD - Wrong country code format
{
  "search_term": "developer",
  "country_indeed": "UK"  // Wrong! Use "united kingdom"
}
```

**✅ DO INSTEAD:**
- Use `get_supported_countries` to verify valid country codes
- Common codes: "usa", "united kingdom", "canada", "germany", "india"

---

## Rate Limiting & Best Practices

### Platform Reliability Ranking

1. **Indeed** - Most reliable, good for large searches
2. **ZipRecruiter** - Reliable for US/Canada
3. **Google Jobs** - Good aggregation, stable
4. **Glassdoor** - Reliable with company insights
5. **LinkedIn** - Most restrictive, use sparingly

### Recommended Approach

1. **Start Small:** Begin with 10-15 results to test filters
2. **Use Indeed First:** Most reliable for job data
3. **Be Specific:** Use targeted search terms
4. **Filter Wisely:** Use one filter group at a time for Indeed/LinkedIn
5. **Paginate:** Use `offset` for getting more results instead of high `results_wanted`

---

## Supported Countries

Call `get_supported_countries` for the complete list. Common countries include:

| Country | Code for `country_indeed` |
|---------|---------------------------|
| USA | `usa` |
| United Kingdom | `united kingdom` |
| Canada | `canada` |
| Germany | `germany` |
| France | `france` |
| India | `india` |
| Australia | `australia` |
| Singapore | `singapore` |
| Japan | `japan` |
| Netherlands | `netherlands` |

---

## Troubleshooting

### "Browser/Chromium not installed"

Run: `playwright install chromium` (some scrapers use Playwright)

### "No module named 'jobspy'"

Run: `pip install python-jobspy>=1.1.82`

### "Rate limit exceeded"

- Reduce results_wanted
- Remove LinkedIn from site_name
- Wait 60 seconds before retrying
- Consider using a proxy

---

## Quick Reference

| User Intent | Key Parameters |
|-------------|----------------|
| Find jobs in a specific city | `search_term`, `location` |
| Remote jobs only | `is_remote: true` |
| Recent postings | `hours_old: 24` (or 48, 72) |
| Full-time only | `job_type: "fulltime"` |
| Quick apply jobs | `easy_apply: true` |
| Search specific platform | `site_name: ["indeed"]` |
| International search | `country_indeed: "germany"` |
| More results | `results_wanted: 25` |
| Paginate results | `offset: 25` (after first 25) |
