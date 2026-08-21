import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GITHUB_USERNAME, getGithubToken, readCache, writeCache } from "../shared/githubClients";

const CACHE_ID = "contribution-calendar";
// Calendar data barely changes intra-day, so a longer TTL than the commit
// feed is fine — reduces GraphQL calls without the data ever looking stale.
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Types ──────────────────────────────────────────────────────────────────

interface ContributionDay {
  date: string;
  count: number;
}

interface ContributionCalendarOut {
  totalContributions: number;
  weeks: ContributionDay[][];
}

interface GraphQLResponse {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
        };
      };
    };
  };
  errors?: { message: string }[];
}

// ─── GitHub GraphQL call ────────────────────────────────────────────────────

const CONTRIBUTIONS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchContributionCalendar(): Promise<ContributionCalendarOut> {
  const token = await getGithubToken();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "one773-site-backend",
    },
    body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: GITHUB_USERNAME } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL returned ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("GitHub GraphQL returned no data");
  }

  const calendar = json.data.user.contributionsCollection.contributionCalendar;

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
    ),
  };
}

// ─── Function ───────────────────────────────────────────────────────────────

export async function GetContributionCalendar(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const forceRefresh = request.query.get("refresh") === "true";

  try {
    if (!forceRefresh) {
      const cached = await readCache<ContributionCalendarOut>(CACHE_ID, CACHE_TTL_MS);
      if (cached) {
        context.log("Serving contribution calendar from cache");
        return { jsonBody: cached };
      }
    } else {
      context.log("Cache bypassed via ?refresh=true");
    }

    const data = await fetchContributionCalendar();
    await writeCache(CACHE_ID, data);

    return { jsonBody: data };
  } catch (err) {
    context.error("GetContributionCalendar failed", err);
    return { status: 500, jsonBody: { error: "Failed to fetch contribution calendar" } };
  }
}

app.http("GetContributionCalendar", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "github-contributions",
  handler: GetContributionCalendar,
});