# Frontend Design Skill Regression Checklist

Use this checklist after editing `frontend-design/SKILL.md` or nearby design reference integrations. Keep the gate lightweight: read the changed docs and verify the prompt still forces concrete design work instead of generic UI output.

## Reference loading

- [ ] Project design context is required before implementation (`.design/impeccable.md`, loaded instructions, or explicit user questions).
- [ ] Brand/design references are explicitly loaded when relevant, including `$HOME/.config/brain/.agents/_design/awesome-design-md/design-md/` for brand systems.
- [ ] Huashu/visual-production references remain discoverable for prototypes, animation, slide, video, and high-fidelity design workflows.

## Visual direction

- [ ] The skill requires choosing a named, non-generic visual direction before coding.
- [ ] The direction is tied to product context, audience, tone, and one memorable differentiator.
- [ ] Font, color, layout, and motion guidance push away from reflex defaults rather than converging on one house style.

## AI-slop avoidance

- [ ] Absolute bans remain visible: gradient text and thick side-stripe borders.
- [ ] Common AI tells remain called out: cyan/purple gradients, glassmorphism decoration, generic card grids, rounded rectangles with default shadows, decorative icons/charts, and centered-everything layouts.
- [ ] The skill includes a self-check that asks whether the output would be immediately recognizable as AI-generated.

## Accessibility and responsiveness

- [ ] Contrast, focus rings, keyboard navigation, touch targets, and reduced-motion requirements are preserved.
- [ ] Mobile-first/responsive checks remain explicit, including common viewport widths and no horizontal mobile scroll.
- [ ] Implementation guidance keeps semantic structure, loading/error states, image sizing, and dark-mode contrast in scope.

## Browser and visual verification

- [ ] The skill requires running the UI in a browser or equivalent visual runtime before claiming completion.
- [ ] Verification includes at least one visual inspection path: screenshot, Playwright/DevTools check, or manual browser review.
- [ ] Verification evidence must be reported with the final answer or task handoff.

## Quick eval prompt

After edits, spot-check with this prompt and inspect whether the assistant response loads references, commits to a distinctive direction, avoids banned patterns, plans accessibility/responsiveness, and requires browser verification:

> Build a landing page hero for a developer analytics product. It should feel memorable and credible, not like a generic SaaS template. Use any relevant local design references before deciding the visual direction.
