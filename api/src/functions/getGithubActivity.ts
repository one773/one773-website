import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GITHUB_REPOS, getGithubToken, readCache, writeCache } from "../shared/githubClients";

const CACHE_ID = "github-activity";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_COMMITS = 5;

const GITHUB_API = "https://api.github.com";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommitOut {
  repo: string;
  message: string;
  time: string;
  added: number;
  removed: number;
}

interface GitHubCommitListItem {
  sha: string;
  commit: { message: string; author?: { date?: string } };
}

interface GitHubCommitDetail {
  stats?: { additions?: number; deletions?: number };
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

  candidates.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const top = candidates.slice(0, MAX_COMMITS);

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
  const forceRefresh = request.query.get("refresh") === "true";

  try {
    if (!forceRefresh) {
      const cached = await readCache<CommitOut[]>(CACHE_ID, CACHE_TTL_MS);
      if (cached) {
        context.log("Serving GitHub activity from cache");
        return { jsonBody: cached };
      }
    } else {
      context.log("Cache bypassed via ?refresh=true");
    }

    const data = await fetchFromGitHub(context);
    await writeCache(CACHE_ID, data);

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