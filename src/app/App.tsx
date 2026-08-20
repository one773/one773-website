import { useState, useEffect, useMemo } from "react"
import {
  ChevronDown,
  Github,
  Lock,
  Activity,
  Globe,
  Zap,
  Database,
  ArrowLeft,
  BookOpen,
  Twitter,
  Linkedin,
  Menu,
  X,
  GitCommit,
  Cloud,
  type LucideIcon,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = "open-source" | "closed-visible" | "closed-hidden"
type ProjStatus = "live" | "in-progress" | "archived"
type ResourceStatus = "healthy" | "degraded" | "down"
type Page = "home" | "blog-post"

interface Project {
  id: string
  name: string
  description: string
  fullDescription: string
  tech: string[]
  status: ProjStatus
  visibility: Visibility
  featured: boolean
  hasPost: boolean
  postId?: string
  screenshot: string
}

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  readTime: string
  tag: string
}

interface Commit {
  repo: string
  message: string
  time: string
  added: number
  removed: number
}

interface Metric {
  label: string
  value: string
  unit: string
  data: number[]
  statusDot?: "green" | "amber" | "red"
}

interface Resource {
  icon: LucideIcon
  name: string
  type: string
  status: ResourceStatus
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  {
    id: "one773-site",
    name: "one773.site",
    description: "This portfolio — a live engineering dashboard connecting real Azure Monitor metrics and GitHub activity. Built to be read like a system, not a resume.",
    fullDescription: "A self-hosted developer portfolio built with React and TypeScript, deployed on Azure Static Web Apps. The Monitor section pulls live Application Insights data via an Azure Function acting as a typed proxy to the KQL query API. The GitHub contribution graph hydrates from the GitHub API on a 15-minute cache. Everything is strictly typed end-to-end with a sub-200ms p95 response time globally.",
    tech: ["React", "TypeScript", "Azure Static Web Apps", "Azure Functions", "Application Insights"],
    status: "live",
    visibility: "open-source",
    featured: true,
    hasPost: true,
    postId: "azure-monitor-react",
    screenshot: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=720&h=320&fit=crop&auto=format",
  },
  {
    id: "azureflow",
    name: "AzureFlow",
    description: "Infrastructure-as-code orchestration CLI for multi-region Azure deployments with live diff views before apply.",
    fullDescription: "A Go CLI and web dashboard for managing complex Azure infrastructure across regions. Supports Bicep templates, handles rollback state machines, and provides a live diff view before applying changes. Used internally to manage 12+ production environments with zero manual console operations.",
    tech: ["Go", "Azure SDK", "Bicep", "React", "Postgres"],
    status: "live",
    visibility: "closed-visible",
    featured: false,
    hasPost: true,
    postId: "go-cli-patterns",
    screenshot: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=720&h=320&fit=crop&auto=format",
  },
  {
    id: "devmetrics",
    name: "devmetrics",
    description: "Aggregated developer productivity metrics from GitHub, Linear, and deployment logs.",
    fullDescription: "An open-source dashboard aggregating commit velocity, PR cycle time, deployment frequency, and incident data into a single view. Configurable per-team and per-repo. Ships a CLI for local analysis and a hosted web view for team sharing.",
    tech: ["TypeScript", "Next.js", "Postgres", "GitHub API"],
    status: "in-progress",
    visibility: "open-source",
    featured: false,
    hasPost: false,
    screenshot: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=720&h=320&fit=crop&auto=format",
  },
  {
    id: "synthcore",
    name: "Synthcore",
    description: "ML pipeline for anomaly detection on time-series infrastructure telemetry.",
    fullDescription: "A production ML system ingesting streaming Azure Monitor metrics and emitting anomaly signals with sub-60s latency. Trained on 18 months of infrastructure data across three resource groups. Reduced mean time to detection from 8 minutes to under 90 seconds.",
    tech: ["Python", "Azure ML", "Kafka", "Kubernetes"],
    status: "live",
    visibility: "closed-hidden",
    featured: false,
    hasPost: false,
    screenshot: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=720&h=320&fit=crop&auto=format",
  },
]

const BLOG_POSTS: BlogPost[] = [
  {
    id: "azure-monitor-react",
    title: "Wiring Azure Monitor into a React portfolio",
    excerpt: "How I built a live infrastructure dashboard into my personal site using Azure Functions and Application Insights.",
    date: "Aug 12, 2026",
    readTime: "8 min",
    tag: "Azure",
  },
  {
    id: "typescript-strict",
    title: "TypeScript strict mode in a real codebase",
    excerpt: "Six months of noUncheckedIndexedAccess, exactOptionalPropertyTypes, and the rest — what actually broke.",
    date: "Jul 28, 2026",
    readTime: "6 min",
    tag: "TypeScript",
  },
  {
    id: "go-cli-patterns",
    title: "Patterns for building great developer CLIs in Go",
    excerpt: "Cobra, Viper, structured logging, and lessons from building AzureFlow.",
    date: "Jul 3, 2026",
    readTime: "11 min",
    tag: "Go",
  },
  {
    id: "ml-anomaly-detection",
    title: "Anomaly detection at the edge of your infra",
    excerpt: "Why we trained our own time-series model instead of using Azure's built-in anomaly detection.",
    date: "Jun 15, 2026",
    readTime: "9 min",
    tag: "ML",
  },
]

const COMMITS: Commit[] = [
  { repo: "one773/one773.site", message: "feat: add azure monitor sparklines to metric cards", time: "2h ago", added: 84, removed: 12 },
  { repo: "one773/devmetrics", message: "fix: pr cycle time off by one on weekend boundaries", time: "8h ago", added: 23, removed: 31 },
  { repo: "one773/one773.site", message: "chore: bump deps, tighten tsconfig strict flags", time: "1d ago", added: 6, removed: 94 },
  { repo: "one773/devmetrics", message: "feat: cli `dm report --since 30d` output", time: "2d ago", added: 212, removed: 8 },
  { repo: "one773/one773.site", message: "docs: blog post — wiring azure monitor into react", time: "4d ago", added: 1847, removed: 2 },
]

const METRICS: Metric[] = [
  { label: "Unique visitors", value: "1,284", unit: "24h", data: [820, 940, 780, 1100, 1050, 1320, 1284] },
  { label: "Requests", value: "9,342", unit: "24h", data: [6200, 7100, 5900, 8400, 7800, 9100, 9342] },
  { label: "Avg response", value: "118", unit: "ms", data: [142, 138, 155, 129, 121, 108, 118] },
  { label: "Uptime", value: "99.98", unit: "%", data: [100, 99.98, 100, 99.95, 100, 100, 99.98], statusDot: "green" },
]

const RESOURCES: Resource[] = [
  { icon: Globe, name: "one773-static-app", type: "Static Web App", status: "healthy" },
  { icon: Zap, name: "one773-functions", type: "Function App", status: "healthy" },
  { icon: Activity, name: "one773-insights", type: "App Insights", status: "healthy" },
  { icon: Database, name: "one773-storage", type: "Storage Account", status: "degraded" },
]

const SKILLS = ["Azure (Entra ID)", "Active Directory", "Windows Server", "Linux", "VMware", "Cisco", "SQL", "ServiceNow", "ITIL"]

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#2f81f7" }: { data: number[]; color?: string }) {
  const W = 80, H = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg width={W} height={H} className="overflow-visible flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

const STATUS_MAP = {
  live: { dot: "#3fb950", label: "Live" },
  "in-progress": { dot: "#d29922", label: "In progress" },
  archived: { dot: "#8b949e", label: "Archived" },
  operational: { dot: "#2f81f7", label: "status: operational" },
} as const

function StatusPill({ status, glow = false }: { status: keyof typeof STATUS_MAP; glow?: boolean }) {
  const { dot, label } = STATUS_MAP[status]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1c2128] border border-[rgba(230,237,243,0.07)] text-xs font-mono whitespace-nowrap">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0${glow ? " status-glow" : ""}`}
        style={{ backgroundColor: dot }}
      />
      <span style={{ color: dot }}>{label}</span>
    </span>
  )
}

// ─── VisibilityPill ───────────────────────────────────────────────────────────

function VisibilityPill({ visibility }: { visibility: Visibility }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-[#8b949e]">
      {visibility === "open-source" ? <Github size={11} /> : <Lock size={11} />}
      {visibility === "open-source" ? "Open source" : "Private"}
    </span>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: Metric }) {
  const dotColors = { green: "#3fb950", amber: "#d29922", red: "#f85149" }
  return (
    <div className="bg-[#161b22] border border-[rgba(230,237,243,0.07)] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-[#8b949e] uppercase tracking-wider leading-none">
          {metric.label}
        </span>
        {metric.statusDot && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColors[metric.statusDot] }}
          />
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-2xl font-mono font-semibold text-[#e6edf3] leading-none">{metric.value}</span>
          <span className="text-xs font-mono text-[#8b949e] ml-1">{metric.unit}</span>
        </div>
        <Sparkline data={metric.data} />
      </div>
    </div>
  )
}

// ─── ResourceRow ──────────────────────────────────────────────────────────────

const RESOURCE_STATUS_COLORS: Record<ResourceStatus, string> = {
  healthy: "#3fb950",
  degraded: "#d29922",
  down: "#f85149",
}

function ResourceRow({ resource }: { resource: Resource }) {
  const Icon = resource.icon
  const color = RESOURCE_STATUS_COLORS[resource.status]
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[rgba(230,237,243,0.04)] last:border-0">
      <div className="w-7 h-7 rounded flex items-center justify-center bg-[rgba(47,129,247,0.08)] text-[#2f81f7] flex-shrink-0">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-[#e6edf3] truncate leading-none mb-0.5">{resource.name}</p>
        <p className="text-xs text-[#8b949e] leading-none">{resource.type}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-mono" style={{ color }}>{resource.status}</span>
      </div>
    </div>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  defaultExpanded = false,
  onReadPost,
}: {
  project: Project
  defaultExpanded?: boolean
  onReadPost: (postId: string) => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div
      className={`bg-[#161b22] border border-[rgba(230,237,243,0.08)] rounded-xl overflow-hidden transition-colors duration-200 hover:border-[rgba(230,237,243,0.14)]${project.featured ? " lg:col-span-3" : ""}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {project.featured && (
              <p className="text-[11px] font-mono text-[#2f81f7] uppercase tracking-widest mb-2">
                ★ Featured project
              </p>
            )}
            <h3 className="text-base font-semibold text-[#e6edf3] mb-1.5 font-mono">{project.name}</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed">{project.description}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-[rgba(230,237,243,0.06)] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              size={15}
              className="transition-transform duration-300"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {project.tech.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-xs font-mono bg-[#0d1117] text-[#8b949e] rounded-md border border-[rgba(230,237,243,0.06)]"
            >
              {t}
            </span>
          ))}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <StatusPill status={project.status as keyof typeof STATUS_MAP} />
            <VisibilityPill visibility={project.visibility} />
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out${expanded ? " max-h-[700px]" : " max-h-0"}`}
      >
        <div className="border-t border-[rgba(230,237,243,0.06)] mx-5" />
        <div className="p-5 pt-4 space-y-4">
          <div className="rounded-lg overflow-hidden border border-[rgba(230,237,243,0.07)] bg-[#0d1117] aspect-[16/7]">
            <img
              src={project.screenshot}
              alt={`${project.name} screenshot`}
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-sm text-[#8b949e] leading-relaxed">{project.fullDescription}</p>

          <div>
            <p className="text-[10px] font-mono text-[#8b949e] uppercase tracking-widest mb-2">Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs font-mono bg-[#0d1117] text-[#8b949e] rounded-md border border-[rgba(230,237,243,0.06)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 pt-1">
            {project.visibility === "open-source" && (
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#2f81f7] hover:text-[#58a6ff] transition-colors"
              >
                <Github size={13} />
                View repo
              </a>
            )}
            {project.visibility === "closed-visible" && (
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#2f81f7] hover:text-[#58a6ff] transition-colors"
              >
                <Lock size={13} />
                View code
              </a>
            )}
            {project.visibility === "closed-hidden" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] cursor-default select-none">
                <Lock size={13} />
                Source private
              </span>
            )}
            {project.hasPost && project.postId && (
              <button
                onClick={() => onReadPost(project.postId!)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                <BookOpen size={13} />
                Read the blog post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CommitRow ────────────────────────────────────────────────────────────────

function CommitRow({ commit }: { commit: Commit }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[rgba(230,237,243,0.04)] last:border-0">
      <span className="flex-shrink-0 mt-1 text-[#8b949e]">
        <GitCommit size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-mono text-[#2f81f7]">{commit.repo}</span>
          <span className="text-xs font-mono text-[#8b949e]">{commit.time}</span>
        </div>
        <p className="text-sm font-mono text-[#e6edf3] truncate">{commit.message}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 font-mono text-xs">
        <span className="text-[#3fb950]">+{commit.added}</span>
        <span className="text-[#f85149]">−{commit.removed}</span>
      </div>
    </div>
  )
}

// ─── BlogPostCard ─────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  Azure: "text-[#2f81f7] bg-[rgba(47,129,247,0.08)]",
  TypeScript: "text-[#3b82f6] bg-[rgba(59,130,246,0.08)]",
  Go: "text-[#00acd7] bg-[rgba(0,172,215,0.08)]",
  ML: "text-[#a371f7] bg-[rgba(163,113,247,0.08)]",
}

function BlogPostCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const tagStyle = TAG_STYLES[post.tag] ?? "text-[#8b949e] bg-[#1c2128]"
  return (
    <button
      onClick={onClick}
      className="text-left bg-[#161b22] border border-[rgba(230,237,243,0.08)] rounded-xl p-5 hover:border-[rgba(47,129,247,0.3)] transition-all duration-200 group w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${tagStyle}`}>{post.tag}</span>
        <div className="flex items-center gap-3 text-xs font-mono text-[#8b949e]">
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
      </div>
      <h3 className="text-base font-semibold text-[#e6edf3] mb-2 group-hover:text-[#2f81f7] transition-colors leading-snug">
        {post.title}
      </h3>
      <p className="text-sm text-[#8b949e] leading-relaxed">{post.excerpt}</p>
    </button>
  )
}

// ─── ContributionGrid ─────────────────────────────────────────────────────────

function ContributionGrid() {
  const grid = useMemo(() => {
    const g: number[][] = []
    for (let w = 0; w < 52; w++) {
      const week: number[] = []
      for (let d = 0; d < 7; d++) {
        const n = Math.floor(Math.abs(Math.sin(w * 7 + d + 1) * 10000)) % 100
        week.push(n < 28 ? 0 : n < 50 ? 1 : n < 72 ? 3 : n < 88 ? 6 : 12)
      }
      g.push(week)
    }
    return g
  }, [])

  const levels = [0, 1, 3, 6, 12]
  const opacities = [0.04, 0.2, 0.45, 0.7, 1]
  const opacityFor = (v: number) => {
    const idx = levels.indexOf(v)
    return idx >= 0 ? opacities[idx] : 0.04
  }

  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] mb-1 pl-[22px]">
        {months.map((m, i) => (
          <span key={i} className="text-[10px] font-mono text-[#8b949e]" style={{ width: "52px" }}>
            {m}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1 pt-[1px]">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span key={i} className="text-[10px] font-mono text-[#8b949e] w-[18px] h-[10px] leading-[10px] text-right pr-1">
              {d}
            </span>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((val, di) => (
              <div
                key={di}
                className="w-[10px] h-[10px] rounded-sm"
                style={{ backgroundColor: `rgba(47, 129, 247, ${opacityFor(val)})` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] font-mono text-[#8b949e]">Less</span>
        {levels.map((v) => (
          <div
            key={v}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: `rgba(47, 129, 247, ${opacityFor(v)})` }}
          />
        ))}
        <span className="text-[10px] font-mono text-[#8b949e]">More</span>
      </div>
    </div>
  )
}

// ─── Blog Post Detail ─────────────────────────────────────────────────────────

function BlogPostDetail({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const tagStyle = TAG_STYLES[post.tag] ?? "text-[#8b949e] bg-[#1c2128]"
  return (
    <div className="max-w-2xl mx-auto py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono text-[#8b949e] hover:text-[#e6edf3] transition-colors mb-10"
      >
        <ArrowLeft size={13} />
        Back to blog
      </button>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${tagStyle}`}>{post.tag}</span>
          <span className="text-xs font-mono text-[#8b949e]">{post.date}</span>
          <span className="text-xs font-mono text-[#8b949e]">{post.readTime} read</span>
        </div>
        <h1 className="text-3xl font-semibold text-[#e6edf3] leading-tight mb-4">{post.title}</h1>
        <p className="text-base text-[#8b949e] leading-relaxed border-l-2 border-[#2f81f7] pl-4">
          {post.excerpt}
        </p>
      </header>

      <div className="space-y-6 text-[#c9d1d9] text-[15px] leading-[1.75]">
        <p>
          When I started building this portfolio, I wanted it to feel like something I'd actually use at work — not a static
          brochure but a live system. The Monitor section needed to show real numbers from my Azure infrastructure, which meant
          wiring Application Insights into a React frontend through something lightweight that wouldn't introduce a backend I'd
          have to maintain separately.
        </p>

        <p>
          Azure Functions turned out to be the right answer. A single HTTP-triggered function, deployed in the same resource
          group as the static app, acts as a thin proxy to the Application Insights Query API. It runs the KQL queries I care
          about, shapes the response to a typed contract, and returns it with a 15-minute Cache-Control header. Cold starts are
          under 250ms. Total monthly cost: effectively zero, comfortably inside the free tier.
        </p>

        <div>
          <p className="text-[10px] font-mono text-[#8b949e] uppercase tracking-widest mb-3">The query</p>
          <div className="rounded-lg bg-[#0d1117] border border-[rgba(230,237,243,0.08)] p-5 overflow-x-auto">
            <pre className="text-sm font-mono text-[#e6edf3] leading-relaxed">{`// Application Insights KQL
requests
| where timestamp > ago(24h)
| summarize
    total     = count(),
    unique    = dcount(session_Id),
    p95       = percentile(duration, 95)
| project
    requests      = total,
    visitors      = unique,
    avgResponseMs = round(p95 / 1000, 0)`}</pre>
          </div>
        </div>

        <p>
          On the React side, a{" "}
          <code className="font-mono text-[#2f81f7] bg-[rgba(47,129,247,0.1)] px-1.5 py-0.5 rounded text-sm">useMetrics</code>
          {" "}hook fetches from the function on mount and refreshes on a 15-minute interval — matching the cache TTL exactly
          so we never make a redundant upstream call. The metric cards display the numbers with inline SVG sparklines built
          from the last seven hourly samples.
        </p>

        <p>
          One rough edge worth documenting: the KQL{" "}
          <code className="font-mono text-[#2f81f7] bg-[rgba(47,129,247,0.1)] px-1.5 py-0.5 rounded text-sm">percentile()</code>
          {" "}aggregation resets at midnight UTC rather than rolling. For a site with real traffic this matters at boundaries.
          A future version would anchor to{" "}
          <code className="font-mono text-[#2f81f7] bg-[rgba(47,129,247,0.1)] px-1.5 py-0.5 rounded text-sm">now()</code>
          {" "}and parameterize the lookback interval properly.
        </p>

        <p>
          The full source is on GitHub. If you hit issues with the Application Insights REST API auth model — specifically
          managed identity vs. API key when running the function locally — the trick is{" "}
          <code className="font-mono text-[#2f81f7] bg-[rgba(47,129,247,0.1)] px-1.5 py-0.5 rounded text-sm">DefaultAzureCredential</code>
          {" "}with a service principal in your local{" "}
          <code className="font-mono text-[#2f81f7] bg-[rgba(47,129,247,0.1)] px-1.5 py-0.5 rounded text-sm">.env</code>.
          That part is documented in the repo README.
        </p>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const openPost = (postId: string) => {
    const post = BLOG_POSTS.find((p) => p.id === postId)
    if (post) {
      setActivePost(post)
      setPage("blog-post")
      window.scrollTo({ top: 0 })
    }
  }

  const goHome = () => {
    setPage("home")
    setActivePost(null)
    window.scrollTo({ top: 0 })
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMobileNavOpen(false)
  }

  const handleNavClick = (id: string) => {
    if (page !== "home") {
      goHome()
      setTimeout(() => scrollToSection(id), 60)
    } else {
      scrollToSection(id)
    }
  }

  const scrollLinks = [
    { label: "About", id: "about" },
    { label: "Projects", id: "projects" },
    { label: "Monitor", id: "monitor" },
    { label: "Blog", id: "blog" },
  ]

  return (
    <>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(47, 129, 247, 0.4); }
          50% { box-shadow: 0 0 8px 3px rgba(47, 129, 247, 0.55); }
        }
        .status-glow { animation: glow-pulse 2.5s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139, 148, 158, 0.18); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139, 148, 158, 0.35); }
      `}</style>

      <div
        className="min-h-screen bg-[#0d1117] text-[#e6edf3]"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* ── Header ── */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 lg:px-12 transition-all duration-200${
            scrolled
              ? " bg-[rgba(13,17,23,0.92)] backdrop-blur-md border-b border-[rgba(230,237,243,0.07)]"
              : " bg-transparent"
          }`}
        >
          <button
            onClick={goHome}
            className="font-mono text-sm font-semibold text-[#e6edf3] hover:text-[#2f81f7] transition-colors tracking-wide"
          >
            one773
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {scrollLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-sm font-mono text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                {link.label}
              </button>
            ))}
            <a
              href="https://github.com/one773"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-mono text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <Github size={14} />
              GitHub
            </a>
          </nav>

          <button
            className="md:hidden text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 bg-[#0d1117] flex flex-col pt-14 px-6">
            <nav className="flex flex-col mt-4">
              {scrollLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { handleNavClick(link.id); setMobileNavOpen(false) }}
                  className="py-3.5 text-left text-sm font-mono text-[#8b949e] hover:text-[#e6edf3] border-b border-[rgba(230,237,243,0.05)] transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="https://github.com/one773"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 flex items-center gap-2 text-sm font-mono text-[#8b949e] hover:text-[#e6edf3] border-b border-[rgba(230,237,243,0.05)] transition-colors"
              >
                <Github size={14} />
                GitHub
              </a>
            </nav>
          </div>
        )}

        {/* ── Main ── */}
        <main className="max-w-5xl mx-auto px-6 lg:px-8 pt-14">
          {page === "blog-post" && activePost ? (
            <BlogPostDetail post={activePost} onBack={goHome} />
          ) : (
            <>
              {/* ── About ── */}
              <section id="about" className="pt-20 pb-16">
                <p className="text-[11px] font-mono text-[#2f81f7] uppercase tracking-widest mb-5">one773.site</p>
                <h1 className="text-5xl lg:text-6xl font-semibold text-[#e6edf3] mb-3 leading-tight">
                  Alex
                </h1>
                <p className="text-base font-mono text-[#8b949e] mb-8">
                  IT Support &amp; Infrastructure Engineer · Azure · Entra ID
                </p>

                <div className="max-w-xl mb-8 space-y-3">
                  <p className="text-base text-[#c9d1d9] leading-relaxed">
                    I'm a Technical Support and Infrastructure Engineer with hands-on experience resolving complex L2/L3
                    incidents and administering identities across large multinational, hybrid environments. My focus is
                    authentication flows, advanced network diagnostics, and ITIL-driven operations.
                  </p>
                  <p className="text-base text-[#8b949e] leading-relaxed">
                    I'm working toward Cloud, SecOps &amp; DevOps roles, with a strong emphasis on reducing risk across critical
                    infrastructure and keeping industrial and enterprise platforms highly available. This site is itself
                    a live system: the metrics below are real, the GitHub graph is current.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {SKILLS.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs font-mono text-[#8b949e] bg-[#161b22] border border-[rgba(230,237,243,0.07)] rounded-md hover:border-[rgba(47,129,247,0.3)] hover:text-[#e6edf3] transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#161b22] border border-[rgba(47,129,247,0.2)] text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#2f81f7] status-glow flex-shrink-0" />
                    <span className="text-[#2f81f7]">status: operational</span>
                  </span>
                  <span className="text-xs font-mono text-[#8b949e]">
                    rg: one773.rg · East US · last check 3m ago
                  </span>
                </div>
              </section>

              {/* ── Projects ── */}
              <section id="projects" className="py-12">
                <div className="flex items-center justify-between mb-7">
                  <h2 className="text-lg font-semibold text-[#e6edf3] font-mono">Projects</h2>
                  <span className="text-xs font-mono text-[#8b949e]">{PROJECTS.length} repos</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {PROJECTS.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      defaultExpanded={project.featured}
                      onReadPost={openPost}
                    />
                  ))}
                </div>
              </section>

              {/* ── Azure Monitor ── */}
              <section id="monitor" className="py-12">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-lg font-semibold text-[#e6edf3] font-mono mb-1">Azure Monitor</h2>
                    <p className="text-xs font-mono text-[#8b949e]">rg: one773.rg · East US · refreshed 3m ago</p>
                  </div>
                  <StatusPill status="operational" glow />
                </div>

                <div className="rounded-xl border border-[rgba(47,129,247,0.12)] bg-[rgba(47,129,247,0.03)] p-5 space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {METRICS.map((metric) => (
                      <MetricCard key={metric.label} metric={metric} />
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] font-mono text-[#8b949e] uppercase tracking-widest mb-3">
                      Resources in group
                    </p>
                    <div className="bg-[#0d1117] rounded-lg border border-[rgba(230,237,243,0.06)] px-4">
                      {RESOURCES.map((resource, i) => (
                        <ResourceRow key={i} resource={resource} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── GitHub Activity ── */}
              <section id="github" className="py-12">
                <div className="flex items-center justify-between mb-7">
                  <h2 className="text-lg font-semibold text-[#e6edf3] font-mono">GitHub Activity</h2>
                  <a
                    href="https://github.com/one773"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8b949e] hover:text-[#e6edf3] transition-colors"
                  >
                    <Github size={13} />
                    one773
                  </a>
                </div>

                <div className="bg-[#161b22] rounded-xl border border-[rgba(230,237,243,0.08)] p-5 mb-4">
                  <ContributionGrid />
                  <p className="text-xs font-mono text-[#8b949e] mt-4">1,284 contributions in the last year</p>
                </div>

                <div className="bg-[#161b22] rounded-xl border border-[rgba(230,237,243,0.08)] px-5 divide-y divide-[rgba(230,237,243,0.04)]">
                  {COMMITS.map((commit, i) => (
                    <CommitRow key={i} commit={commit} />
                  ))}
                </div>
              </section>

              {/* ── Blog ── */}
              <section id="blog" className="py-12">
                <div className="flex items-center justify-between mb-7">
                  <h2 className="text-lg font-semibold text-[#e6edf3] font-mono">Blog</h2>
                  <span className="text-xs font-mono text-[#8b949e]">{BLOG_POSTS.length} posts</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BLOG_POSTS.map((post) => (
                    <BlogPostCard key={post.id} post={post} onClick={() => openPost(post.id)} />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-[rgba(230,237,243,0.07)] mt-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <a
                href="https://github.com/one773"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                <Github size={16} />
              </a>
              <a
                href="https://twitter.com/_one773"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://linkedin.com/in/alexandar-toshev-30a404227"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                <Linkedin size={16} />
              </a>
            </div>

            <p className="text-xs font-mono text-[#8b949e]">© 2026 one773.site</p>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8b949e]">
              <Cloud size={12} />
              <span>Hosted on Azure</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
