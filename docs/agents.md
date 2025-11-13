# Adaptive Content & Motion Guide

This document is the operating manual for extending the archetype-aware surfaces on the site. It covers how to add new narrative cards, connect photos, and tune the dharma wheel motion strategies that respond to the visitor's selected lens.

## 1. Bio Cards (Archetype Stories)

### Data model
- Source file: `src/data/bioCards.json`
- Top-level keys:
  - `defaultOrder`: default four-lens shuffle order.
  - `cards`: record keyed by `LensId` (`engineer`, `lw-math`, `embodied`, `buddhist`). Each entry is an array of card objects: `{ id, title, summary, image }`.
- Images should live at `public/images/bio/<slug>.<ext>`; reference them via `/images/bio/<slug>.<ext>`.

### Adding content
1. Draft prose in Markdown/plain text (keep a scratchpad in `downloads/bio/vN.md` if helpful).
2. Break into focused paragraphs (one per card) with a strong hook sentence.
3. Drop the card into the appropriate array. Use unique `id`s; camel-case with hyphen separators is fine.
4. Ensure each card in the lens has a matching photo (`image` field). If you have not added the asset yet, leave a TODO comment and drop the file in `public/images/bio/` later.
5. Refresh the page; the default four-up layout will now draw from the expanded set.

### Randomisation behaviour
- Default view displays one randomly selected card per lens (without repetition) every time the grid is reset.
- Clicking a card locks that lens; the other three cards switch to the locked archetype, iterating through all stories in that lens.

## 2. Motion Strategies (Dharma Wheel)

### Structure
- Config: `src/data/content.json > physics > dharmaWheel`.
- Keys:
  - `visual`: size/opacity defaults.
  - `defaultStrategy`: fallback strategy key.
  - `strategies`: registry of named strategies. Each entry defines a `type` (`zen`, `flow-field`, etc.) and `parameters` object.
  - `lensProfiles`: map of `LensId` → { `strategy`, optional `parameters` overrides }.

### Strategy registry
- Registry lives in `src/physics/registry.ts`.
- Implement algorithms under `src/physics/strategies/` and export via the registry.
- Strategy signature: `StrategyFactory(config, { seed }) => { reset(env), step(env) }`.

### Hook usage
- `WanderingDharmaWheel` pulls the profile via `getWheelMotionProfile(lensId)` and invokes `useMotionStrategy` with the returned `type` + `parameters`.
- To add a new algorithm:
  1. Create `src/physics/strategies/<name>.ts` implementing the factory.
  2. Register it in `src/physics/registry.ts`.
  3. Add a strategy entry to `content.json` with `type: "<name>"`.
  4. Point any lens profile at the new key or create a new profile overlay.

### Simulation & logging
- CLI: `node scripts/simulate_wheel.js --lens engineer --duration 60000`
- Options: `--lens`, `--strategy`, `--duration`, `--step`, `--seed`, `--width`, `--height`.
- Output: log JSON saved under `logs/dharma-wheel-<type>-<timestamp>.json` with metadata + sampled positions.
- Use the logs to inspect coverage, min/max speed, and heat-map the path. (Tip: load in a notebook to visualise trajectories.)

## 3. Adding Assets
- Place lifestyle/project photos in `public/images/bio/`.
- Suggested additions (based on current prose gaps):
  - Dance / movement practice (embodied lens).
  - Ice skating session shots.
  - Drone building/flying workspace.
  - VR / headset in-use photo.
  - Math research artifacts (whiteboard derivations, notebooks).
- When supplying new photos, keep filenames kebab-cased (`dance-studio.jpg`) and update references in `bioCards.json`.

## 4. Extending Archetypes
- To introduce a new archetype, update `content.json` (`lenses` array + `lensMapping` + `physics.dharmaWheel.lensProfiles`) and add cards under `bioCards.json`.
- Keep each archetype's voice distinct (engineer = pragmatic, lw-math = systems/rationality, embodied = somatic, buddhist = contemplative).

## 5. Review Checklist
- [ ] New cards have accompanying images.
- [ ] Strategy parameters are documented (consider inline comments if non-obvious).
- [ ] Simulator run logged for each new strategy.
- [ ] Lint/TS compile clean (or known issues noted).

Keep this document updated as the system evolves so future agents know how to plug new artefacts into the experience without spelunking through code.
