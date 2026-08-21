import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";
import { SecretClient } from "@azure/keyvault-secrets";

// ─── Config (from Function App settings — see setup notes) ────────────────────

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || "https://one773-cosmos.documents.azure.com:443/";
const COSMOS_DATABASE = process.env.COSMOS_DATABASE || "one773-cache";
const COSMOS_CONTAINER = process.env.COSMOS_CONTAINER || "cache-items";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "one773";
const KEY_VAULT_URL = process.env.KEY_VAULT_URL || "https://one773-kv.vault.azure.net";
// Comma-separated "owner/repo" list, e.g. "one773/one773-website,one773/devmetrics"
const GITHUB_REPOS = (process.env.GITHUB_REPOS || `${GITHUB_USERNAME}/one773-website`)
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const CACHE_ID = "github-activity";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_COMMITS = 5;

// DefaultAzureCredential works two ways depending on where it runs:
// - Locally: falls back to your own `az login` session
// - Deployed: uses the Function App's system-assigned managed identity
// The same credential is used for Cosmos DB *and* Key Vault below — no
// plaintext secret ever needs to sit in a local config file.
const credential = new DefaultAzureCredential();
const cosmosClient = new CosmosClient({ endpoint: COSMOS_ENDPOINT, aadCredentials: credential });
const container = cosmosClient.database(COSMOS_DATABASE).container(COSMOS_CONTAINER);

const secretClient = new SecretClient(KEY_VAULT_URL, credential);

// Fetched once per cold start, then reused — avoids hitting Key Vault on every request.
let cachedToken: string | null = null;
async function getGithubToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const secret = await secretClient.getSecret("github-token");
  if (!secret.value) throw new Error("github-token secret has no value");
  cachedToken = secret.value;
  return cachedToken;
}

const GITHUB_API = "https://api.github.com";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommitOut {
  repo: string;
  message: string;
  time: string;
  added: number;
  removed: number;
}

interface CacheDoc {
  id: string;
  cachedAt: string;
  data: CommitOut[];
}

interface GitHubCommitDetail {
  stats?: { additions?: number; deletions?: number };
}

interface GitHubCommitListItem {
  sha: string;
  commit: { message: string; author?: { date?: string } };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function githubGet<T>(path: string): Promise<T> {
  const token = await getGithubToken();
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "one773-site-backend",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} returned ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function fetchFromGitHub(context: InvocationContext): Promise<CommitOut[]> {
  // Query each repo the token actually has access to, directly — fine-grained
  // tokens are repo-scoped, so this is a better fit than the account-wide
  // events feed (which also only shows *public* activity regardless of token).
  const candidates: { repo: string; sha: string; message: string; time: string }[] = [];

  for (const repo of GITHUB_REPOS) {
    try {
      const commits = await githubGet<GitHubCommitListItem[]>(`/repos/${repo}/commits?per_page=5`);
      for (const c of commits) {
        candidates.push({
          repo,
          sha: c.sha,
          message: c.commit.message.split("\n")[0],
          time: c.commit.author?.date ?? new Date().toISOString(),
        });
      }
    } catch (err) {
      context.warn(`Could not list commits for ${repo}`, err);
    }
  }

  // Newest first, across all repos combined.
  candidates.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const top = candidates.slice(0, MAX_COMMITS);

  // Fetch real diff stats per commit. Bounded to MAX_COMMITS calls, so this
  // stays well within rate limits even refreshed every few minutes.
  const results: CommitOut[] = [];
  for (const c of top) {
    try {
      const detail = await githubGet<GitHubCommitDetail>(`/repos/${c.repo}/commits/${c.sha}`);
      results.push({
        repo: c.repo,
        message: c.message,
        time: relativeTime(c.time),
        added: detail.stats?.additions ?? 0,
        removed: detail.stats?.deletions ?? 0,
      });
    } catch (err) {
      context.warn(`Could not fetch stats for ${c.repo}@${c.sha}`, err);
      results.push({ repo: c.repo, message: c.message, time: relativeTime(c.time), added: 0, removed: 0 });
    }
  }

  return results;
}

// ─── Function ───────────────────────────────────────────────────────────────

export async function GetGithubActivity(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // 1. Check cache
    try {
      const { resource: cached } = await container.item(CACHE_ID, CACHE_ID).read<CacheDoc>();
      if (cached) {
        const age = Date.now() - new Date(cached.cachedAt).getTime();
        if (age < CACHE_TTL_MS) {
          context.log("Serving GitHub activity from cache");
          return { jsonBody: cached.data };
        }
      }
    } catch {
      // Item doesn't exist yet — fall through to a live fetch.
      context.log("No cache entry yet, fetching fresh");
    }

    // 2. Fetch fresh data
    const data = await fetchFromGitHub(context);

    // 3. Write cache (fire-and-forget-ish, but awaited so failures surface in logs)
    const doc: CacheDoc = { id: CACHE_ID, cachedAt: new Date().toISOString(), data };
    await container.items.upsert(doc);

    return { jsonBody: data };
  } catch (err) {
    context.error("GetGithubActivity failed", err);
    return { status: 500, jsonBody: { error: "Failed to fetch GitHub activity" } };
  }
}

app.http("GetGithubActivity", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "github-activity",
  handler: GetGithubActivity,
});