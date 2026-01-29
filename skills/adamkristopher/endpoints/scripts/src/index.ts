import { config } from "dotenv";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });

// Configuration
const API_URL = process.env.ENDPOINTS_API_URL || "https://endpoints.work";
const API_KEY = process.env.ENDPOINTS_API_KEY;

if (!API_KEY) {
  console.error("Error: ENDPOINTS_API_KEY not set");
  console.error("Set it in .env file: ENDPOINTS_API_KEY=ep_your_key_here");
  process.exit(1);
}

// Types
interface TreeEndpoint {
  id: number;
  path: string;
  slug: string;
}

interface TreeCategory {
  name: string;
  endpoints: TreeEndpoint[];
}

interface TreeResponse {
  categories: TreeCategory[];
}

interface MetadataItem {
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  originalText?: string;
  summary: string;
  entities: Array<{ name: string; type: string; role?: string }>;
}

interface EndpointDetails {
  endpoint: {
    id: number;
    path: string;
    category: string;
    slug: string;
  };
  metadata: {
    oldMetadata: Record<string, MetadataItem>;
    newMetadata: Record<string, MetadataItem>;
  };
  totalItems: number;
}

interface ScanResult {
  endpoint: {
    path: string;
    category: string;
    slug: string;
  };
  entriesAdded: number;
  metadata: {
    newMetadata: Record<string, MetadataItem>;
  };
}

interface FileUrlResponse {
  url: string;
  expiresIn: number;
}

interface StatsResponse {
  tier: string;
  parsesUsed: number;
  parsesLimit: number;
  storageUsed: number;
  storageLimit: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

// HTTP Client
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

// Result saving utilities
function getResultsDir(category: string): string {
  const dir = join(__dirname, "../../results", category);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function saveResult(category: string, name: string, data: unknown): string {
  const dir = getResultsDir(category);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = name
    ? `${name.replace(/[^a-z0-9]/gi, "_")}.json`
    : `${timestamp}__result.json`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

// ============================================
// ENDPOINT FUNCTIONS
// ============================================

/**
 * List all endpoints organized by category
 */
export async function listEndpoints(): Promise<TreeResponse> {
  const result = await apiRequest<TreeResponse>("/api/endpoints/tree");
  saveResult("endpoints", "tree", result);
  return result;
}

/**
 * Get full endpoint details with metadata
 */
export async function getEndpoint(path: string): Promise<EndpointDetails> {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const result = await apiRequest<EndpointDetails>(
    `/api/endpoints/${normalizedPath}`
  );
  const name = normalizedPath.replace(/\//g, "_");
  saveResult("endpoints", name, result);
  return result;
}

/**
 * Create a new empty endpoint
 */
export async function createEndpoint(
  path: string
): Promise<{ success: boolean; endpoint: EndpointDetails["endpoint"] }> {
  const result = await apiRequest<{
    success: boolean;
    endpoint: EndpointDetails["endpoint"];
  }>("/api/endpoints", {
    method: "POST",
    body: JSON.stringify({ path, items: [] }),
  });
  saveResult("endpoints", `created_${path.replace(/\//g, "_")}`, result);
  return result;
}

/**
 * Delete endpoint and all associated files
 */
export async function deleteEndpoint(
  path: string
): Promise<{ success: boolean; message: string }> {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return apiRequest<{ success: boolean; message: string }>(
    `/api/endpoints/${normalizedPath}`,
    { method: "DELETE" }
  );
}

// ============================================
// SCANNING FUNCTIONS
// ============================================

/**
 * Scan text content with AI extraction
 */
export async function scanText(
  text: string,
  prompt: string
): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("texts", text);
  formData.append("prompt", prompt);

  const result = await apiRequest<ScanResult>("/api/scan", {
    method: "POST",
    body: formData,
  });

  const name = `scan_${prompt.replace(/[^a-z0-9]/gi, "_")}`;
  saveResult("scans", name, result);
  return result;
}

/**
 * Scan file (PDF, images, docs) with AI extraction
 */
export async function scanFile(
  filePath: string,
  prompt: string
): Promise<ScanResult> {
  const fileContent = readFileSync(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  formData.append("files", new Blob([fileContent]), fileName);
  formData.append("prompt", prompt);

  const result = await apiRequest<ScanResult>("/api/scan", {
    method: "POST",
    body: formData,
  });

  const name = `scan_${fileName.replace(/[^a-z0-9]/gi, "_")}`;
  saveResult("scans", name, result);
  return result;
}

// ============================================
// ITEM FUNCTIONS
// ============================================

/**
 * Delete a single item by its 8-character ID
 */
export async function deleteItem(
  itemId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/api/items/${itemId}`,
    { method: "DELETE" }
  );
}

// ============================================
// FILE FUNCTIONS
// ============================================

/**
 * Get presigned S3 URL for a file
 */
export async function getFileUrl(
  key: string,
  expiresIn?: number
): Promise<FileUrlResponse> {
  const params = new URLSearchParams({ format: "json" });
  if (expiresIn) params.append("expiresIn", expiresIn.toString());

  return apiRequest<FileUrlResponse>(`/api/files/${key}?${params}`);
}

// ============================================
// BILLING FUNCTIONS
// ============================================

/**
 * Get usage stats (parses, storage, tier)
 */
export async function getStats(): Promise<StatsResponse> {
  const result = await apiRequest<StatsResponse>("/api/billing/stats");
  saveResult("billing", "stats", result);
  return result;
}

// ============================================
// CLI DEMO
// ============================================

async function main() {
  console.log("Endpoints API Toolkit\n");

  try {
    // Demo: List endpoints
    console.log("Fetching endpoints...");
    const { categories } = await listEndpoints();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach((cat) => {
      console.log(`  ${cat.name}: ${cat.endpoints.length} endpoints`);
    });

    // Demo: Get stats
    console.log("\nFetching usage stats...");
    const stats = await getStats();
    console.log(`Tier: ${stats.tier}`);
    console.log(`Parses: ${stats.parsesUsed}/${stats.parsesLimit}`);
    console.log(
      `Storage: ${(stats.storageUsed / 1024 / 1024).toFixed(2)} MB / ${(stats.storageLimit / 1024 / 1024 / 1024).toFixed(2)} GB`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
