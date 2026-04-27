---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics. Includes brand design references, UX guidelines, polish principles, and anti-pattern detection.
disable-model-invocation: true
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

disable-model-invocation: true
---

## Context Gathering

Design skills produce generic output without project context. Before doing design work:

1. **Check loaded instructions**: If your system prompt already contains a **Design Context** section, proceed.
2. **Check `.design/impeccable.md`**: Read from the project root. If it exists with required context, proceed.
3. **Ask the user**: If neither source has context, ask about target audience, brand personality, and aesthetic direction before designing.

disable-model-invocation: true
---

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

disable-model-invocation: true
---

## Brand Design References

When the user says "like Stripe", "inspired by Linear", or references a specific brand, look up its design system for exact tokens (hex colors, font weights, shadow definitions, spacing).

**Location**: `$HOME/.config/brain/.agents/_design/awesome-design-md/design-md/`

```bash
# List all available brands (66+)
ls $HOME/.config/brain/.agents/_design/awesome-design-md/design-md/

# Read a specific brand's design system
cat $HOME/.config/brain/.agents/_design/awesome-design-md/design-md/<brand>/README.md
```

**Available brands include**: linear.app, notion, vercel, supabase, cursor, stripe, airbnb, uber, spotify, apple, claude, figma, framer, hashicorp, sentry, resend, raycast, superhuman, wise, and many more.

If the brand README only contains a URL pointer (e.g. `https://getdesign.md/<brand>/design-md`), fetch it with `web_fetch` to get the full design tokens.

If no brand is named, choose 1-3 relevant brand references based on the product type and desired tone.

disable-model-invocation: true
---

## Design System Generator

For comprehensive design recommendations (style, colors, typography, effects), use the ui-ux-pro-max search tool:

```bash
# Full design system recommendation
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system

# Domain-specific searches
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain style
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain color
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain typography
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain ux
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain chart
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain landing
python3 $HOME/.config/brain/.agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain google-fonts
```

Use `--design-system` first for full recommendations, then `--domain` to deep-dive any dimension. Available domains: product, style, color, typography, landing, chart, ux, google-fonts, react, web, prompt.

disable-model-invocation: true
---

## Frontend Aesthetics Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font.

**Font Selection Procedure** — do this BEFORE typing any font name:

1. Write 3 concrete words for the brand voice (e.g., "warm and mechanical and opinionated"). NOT "modern" or "elegant" — those are dead categories.
2. List the 3 fonts you'd normally reach for. They're probably from this banned list:

**Banned reflex fonts** (training-data defaults that create monoculture):
Fraunces, Newsreader, Lora, Crimson, Crimson Pro, Crimson Text, Playfair Display, Cormorant, Cormorant Garamond, Syne, IBM Plex Mono/Sans/Serif, Space Mono, Space Grotesk, Inter, DM Sans, DM Serif Display/Text, Outfit, Plus Jakarta Sans, Instrument Sans, Instrument Serif

3. Browse a font catalog with the 3 brand words in mind. Sources: Google Fonts, Pangram Pangram, Future Fonts, Adobe Fonts, ABC Dinamo, Klim Type Foundry, Velvetyne. Look for something that fits the brand as a *physical object*.
4. Cross-check: if your final pick matches your reflex pattern, go back to step 3.

**Typography rules**:
- Use a modular type scale with fluid sizing (clamp) for headings on marketing/content pages. Use fixed `rem` scales for app UIs and dashboards.
- Use fewer sizes with more contrast. A 5-step scale with ≥1.25 ratio between steps beats 8 sizes at 1.1×.
- Line-height scales inversely with line length. For light text on dark backgrounds, ADD 0.05-0.1.
- Cap line length at ~65-75ch. Use `text-wrap: balance` on headings, `text-wrap: pretty` for body text.
- Use `font-variant-numeric: tabular-nums` for dynamically updating numbers.
- Apply `-webkit-font-smoothing: antialiased` to root for crisper text on macOS.

### Color & Theme

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

- **Use OKLCH, not HSL**. OKLCH is perceptually uniform. As you move toward white or black, REDUCE chroma.
- **Tint neutrals toward your brand hue**. Even chroma of 0.005-0.01 creates subconscious cohesion.
- **60-30-10 rule**: 60% neutral/surface, 30% secondary text and borders, 10% accent. Accents work BECAUSE they're rare.
- **Theme from context**: Light vs dark should be DERIVED from audience and viewing context, not picked from a default. When is this product used, by whom, in what physical setting?

**Color rules**:
- DO use modern CSS color functions (oklch, color-mix, light-dark)
- DO NOT use pure black (#000) or pure white (#fff) — always tint
- DO NOT use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark
- DO NOT use gradient text (background-clip: text + gradient) — it's a top AI design tell
- DO NOT use gray text on colored backgrounds; use a shade of the background color instead

### Layout & Space

Create visual rhythm through varied spacing, not the same padding everywhere.

- Use a 4pt spacing scale with semantic token names. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Use `gap` instead of margins for sibling spacing.
- Vary spacing for hierarchy — headings with extra space above read as more important.
- Self-adjusting grid: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- Container queries for components, viewport queries for page layout.

**Layout rules**:
- DO use asymmetry and unexpected compositions; break the grid intentionally
- DO NOT wrap everything in cards. Not everything needs a container.
- DO NOT nest cards inside cards.
- DO NOT use identical card grids (same-sized cards with icon + heading + text, repeated endlessly)
- DO NOT center everything. Left-aligned text with asymmetric layouts feels more designed.

### Motion

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

- Use exponential easing (ease-out-quart/quint/expo) for natural deceleration
- Duration 150–300ms for micro-interactions; complex transitions ≤400ms
- For height animations, use grid-template-rows transitions instead of animating height directly
- Split enter animations into semantic chunks, stagger each with ~100ms delay
- Exit animations should be softer/faster than enters (~60-70% of enter duration)
- DO NOT animate layout properties (width, height, padding, margin) — use transform and opacity only
- DO NOT use bounce or elastic easing — real objects decelerate smoothly
- Respect `prefers-reduced-motion`

### Visual Details

**Absolute bans** — these are the most recognizable AI design tells:

1. **Side-stripe borders**: `border-left` or `border-right` with width > 1px on cards/callouts/alerts. Rewrite with background tints, leading numbers/icons, or no indicator at all.
2. **Gradient text**: `background-clip: text` combined with a gradient. Use solid colors; emphasize with weight or size instead.

**More rules**:
- DO NOT use glassmorphism everywhere (blur effects, glass cards, glow borders used decoratively)
- DO NOT use sparklines as decoration — tiny charts that convey nothing meaningful
- DO NOT use rounded rectangles with generic drop shadows — safe, forgettable, could be any AI output
- DO NOT put large icons with rounded corners above every heading — makes sites look templated

disable-model-invocation: true
---

## Interface Polish Principles

Apply these details that compound into a great experience:

### Surfaces
- **Concentric border radius**: outer = inner + padding. Mismatched radii is the #1 thing that makes interfaces feel off.
- **Optical alignment**: When geometric centering looks off, adjust optically. Play icons, asymmetric icons all need manual tweaks.
- **Shadows over borders**: Layer multiple transparent `box-shadow` values for natural depth. Shadows adapt to any background.
- **Image outlines**: Add a subtle `1px` outline with low opacity to images for consistent depth.

### Interactions
- **Scale on press**: `scale(0.96)` on click gives tactile feedback. Never below `0.95`.
- **Cursor pointer**: Always add `cursor: pointer` to buttons, clickable elements, anything with interactive behavior. Non-negotiable.
- **Minimum hit area**: 44×44px minimum. Extend with pseudo-element if visible element is smaller. Never let hit areas overlap.
- Use CSS transitions for interactive state changes (interruptible). Reserve keyframes for staged sequences.

### Animation Details
- Icon animations: `opacity`, `scale`, `blur` — scale from 0.25→1, opacity 0→1, blur 4px→0px
- Skip animation on page load: `initial={false}` on `AnimatePresence`
- Never use `transition: all` — always specify exact properties
- Use `will-change` sparingly, only for `transform`, `opacity`, `filter`

disable-model-invocation: true
---

## UX Quality Checklist

### Critical (Always Check)
- [ ] Color contrast ≥4.5:1 for normal text, ≥3:1 for large text
- [ ] Visible focus rings on interactive elements
- [ ] Keyboard navigation works (tab order matches visual order)
- [ ] Touch targets ≥44×44px with ≥8px spacing between
- [ ] Loading feedback on async operations (skeleton/spinner after 300ms)
- [ ] `prefers-reduced-motion` respected

### High Priority
- [ ] Mobile-first with systematic breakpoints (375 / 768 / 1024 / 1440)
- [ ] No horizontal scroll on mobile
- [ ] Min 16px body text on mobile (avoids iOS auto-zoom)
- [ ] Images: WebP/AVIF, responsive (srcset/sizes), lazy load non-critical
- [ ] Declare image width/height or aspect-ratio to prevent CLS
- [ ] font-display: swap to avoid FOIT
- [ ] Semantic color tokens, not raw hex in components
- [ ] Dark mode contrast tested independently

### Medium Priority
- [ ] Visible labels per input (not placeholder-only)
- [ ] Error messages below related field with recovery path
- [ ] Empty states that teach the interface
- [ ] Toast auto-dismiss in 3-5s
- [ ] Confirm before destructive actions
- [ ] Animations 150-300ms with ease-out
- [ ] No nested scroll regions interfering with main scroll

disable-model-invocation: true
---

## AI Slop Test

**Critical quality check**: If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

Watch for: overused font families, cliché color schemes (purple gradients on white), predictable layouts, identical card grids, gradient text, side-stripe borders, glassmorphism decoration, hero metric layout templates (big number + small label + supporting stats), and cookie-cutter component patterns.

disable-model-invocation: true
---

## Implementation Principles

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code. Minimalist designs need restraint and precision.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

Remember: Claude is capable of extraordinary creative work. Don't hold back. Show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
