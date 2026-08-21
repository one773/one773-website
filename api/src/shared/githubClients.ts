import { DefaultAzureCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";
import { SecretClient } from "@azure/keyvault-secrets";

// ─── Shared config ──────────────────────────────────────────────────────────
// One place for every endpoint's environment settings, instead of each
// function file redefining the same constants.

export const COSMOS_ENDPOINT =
  process.env.COSMOS_ENDPOINT || "https://one773-cosmos.documents.azure.com:443/";
export const COSMOS_DATABASE = process.env.COSMOS_DATABASE || "one773-cache";
export const COSMOS_CONTAINER = process.env.COSMOS_CONTAINER || "cache-items";
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "one773";
export const KEY_VAULT_URL = process.env.KEY_VAULT_URL || "https://one773-kv.vault.azure.net";
// The GITHUB_REPOS env var is a comma-separated list of repos to fetch commits from. If not set, defaults to the one773-website repo. 
export const GITHUB_REPOS = (process.env.GITHUB_REPOS || `${GITHUB_USERNAME}/one773-website`)
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

// ─── Shared clients ─────────────────────────────────────────────────────────
// One credential, one Cosmos container, one Key Vault client — reused by
// every endpoint that needs them, instead of each file creating its own.

// DefaultAzureCredential works two ways depending on where it runs:
// - Locally: falls back to your own `az login` session
// - Deployed: uses the Function App's system-assigned managed identity
export const credential = new DefaultAzureCredential();

const cosmosClient = new CosmosClient({ endpoint: COSMOS_ENDPOINT, aadCredentials: credential });
export const cacheContainer = cosmosClient.database(COSMOS_DATABASE).container(COSMOS_CONTAINER);

const secretClient = new SecretClient(KEY_VAULT_URL, credential);

// Fetched once per cold start, then reused — avoids hitting Key Vault on
// every single request across every endpoint.
let cachedToken: string | null = null;
export async function getGithubToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const secret = await secretClient.getSecret("github-token");
  if (!secret.value) throw new Error("github-token secret has no value");
  cachedToken = secret.value;
  return cachedToken;
}

// ─── Shared cache helpers ───────────────────────────────────────────────────

export interface CacheDoc<T> {
  id: string;
  cachedAt: string;
  data: T;
}

/** Reads a cache item if it exists and is younger than ttlMs. Returns null otherwise. */
export async function readCache<T>(id: string, ttlMs: number): Promise<T | null> {
  try {
    const { resource } = await cacheContainer.item(id, id).read<CacheDoc<T>>();
    if (!resource) return null;
    const age = Date.now() - new Date(resource.cachedAt).getTime();
    return age < ttlMs ? resource.data : null;
  } catch {
    return null; // item doesn't exist yet
  }
}

export async function writeCache<T>(id: string, data: T): Promise<void> {
  const doc: CacheDoc<T> = { id, cachedAt: new Date().toISOString(), data };
  await cacheContainer.items.upsert(doc);
}