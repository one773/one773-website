Design a personal portfolio site for a developer hosted at one773.site. Dark mode only.
Calm, technical, precise — an engineer's dashboard, not a marketing page. Use realistic
placeholder data throughout; this is a visual design pass only, no functionality.

STYLE
Background: near-black with a subtle blue-gray tint (#0d1117-ish). One Azure-blue accent
color for links, active states, chart lines, and status glows — used sparingly. Monospace
font for metrics, labels, and code; a clean sans-serif for prose and headings. 1px borders
instead of shadows, 8–12px rounded corners, generous whitespace, confident type scale.

LAYOUT — top to bottom

1. Header
   Logo/name left, nav (About / Projects / Monitor / GitHub / Blog) right, subtle border
   on scroll.

2. About (hero)
   Name, one-line role/bio, a short 2–3 sentence intro paragraph in a slightly larger
   treatment to set a personal tone against the technical rest of the page. A row of
   skill/stack tags (e.g. Azure, TypeScript, React) as compact monospace pills. A soft
   "status: operational" pill with a pulsing accent-color dot ties this section to the
   live-system feel of the page.

3. Projects
   A grid of 3–4 project cards, each with: project name, one-line description, a tech
   stack row (2–3 monospace tags), a status pill ("Live," "In progress," "Archived"), and
   a visibility pill ("Open source" / "Private"). Each card has a chevron/expand control
   in the corner that reveals an inline dropdown panel below the card content, pushing
   the layout down rather than opening a modal.

   Expanded state — open source projects:
   Full write-up (short paragraph), an expanded tech stack list, a small screenshot/mockup
   thumbnail, and two action links: "View repo" and "Read the blog post" (if one exists),
   styled as understated text links with small icons, not buttons.

   Expanded state — closed source, code visible:
   Same layout and full write-up, screenshot included, plus a "View code" link (styled
   identically to "View repo" but with a small lock-outline icon instead of the standard
   repo icon) — signaling "you can look, but this is a controlled/limited view," distinct
   from a fully open repo link.

   Expanded state — closed source, code hidden:
   Same layout and full write-up, screenshot still included, but the code link is replaced
   with a static "Source private" label (muted text, small lock-filled icon, non-interactive)
   — so the panel still reads as complete rather than empty, just missing that one action.

   In all three states, the "Read the blog post" link appears independently whenever a post
   exists — it's not tied to code visibility, since a private project can still have a public
   write-up about it.

   One card is visually promoted as a featured project — larger, defaults to expanded on
   load, placeholder screenshot area, and a 2-sentence description instead of one line even
   when collapsed. Consistent hover/expand transition across all cards (smooth height
   animation, chevron rotates on open).

4. Azure Monitor — resource group health
   A row of 4 metric cards, each with a label, a large monospace number, a small
   sparkline, and (where relevant) a colored status dot:
     - Unique visitors (24h): 1,284 — upward sparkline
     - Requests (24h): 9,342 — sparkline
     - Avg response time: 118ms — sparkline
     - Uptime (30 days): 99.98% — green status dot
   Below the cards, a "resources in this group" list: 3–4 rows, each showing a resource
   type icon, resource name, and a status dot (green/amber/red), echoing Azure Monitor's
   Resource Health view. Give this section a distinct card surface tone from the rest of
   the page so it reads as live infrastructure.

5. GitHub activity
   A stylized recreation of GitHub's contribution graph (square grid), re-themed in the
   dark palette using the accent blue instead of green, with varying square opacity to
   show activity intensity. Below it, a feed of 5 recent commits, each with: repo name,
   commit message, relative timestamp, and a small "+X −Y" diff stat chip (green/red).
   Give this feed a compact, code-adjacent visual treatment — monospace repo/commit text,
   tighter row spacing than the Projects or Blog cards.

6. Blog
   A grid of 4 post cards, each with: title, short one-line excerpt, date, and estimated
   read time, plus a small topic tag pill. Treat these as genuine content cards — same
   visual weight as Project cards, not a footnote. Also design one full sample blog post
   detail page: title, metadata row, body copy with a styled monospace code block, and a
   back-to-blog link.

7. Footer
   Minimal — social/GitHub icon links, copyright, small "hosted on Azure" mark.

COMPONENTS TO BUILD AS REUSABLE
- Metric card (label, number, sparkline, optional status dot)
- Resource status row (icon, name, status dot)
- Project card (collapsed + expanded states; open-source, closed-source-visible, and
  closed-source-hidden code variants) + featured variant
- Commit row (repo, message, relative time, diff stat chips)
- Blog post card (title, excerpt, date, read time, topic tag)
- Status pill (colored dot + label, soft glow variant)
- Visibility pill (Open source / Private)

DELIVERABLES
Desktop frame (1440px) and mobile frame (375px) for the homepage, showing at least one
project card in its collapsed state and one in its expanded state (open source variant),
plus one full sample blog post detail page. Figma auto-layout throughout for a clean dev
handoff.