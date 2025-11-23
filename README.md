# Aditya's Portfolio - Building Bridges to Niche Subcultures

A zen-inspired personal portfolio website built with Next.js, featuring contemplative design, interactive audience lenses, and deep integration with your creative work.

## ✨ Features

### Core Features
- **🎡 Dharma Wheel Hero** - Slowly rotating SVG wheel representing the Noble Eightfold Path
- **🎯 Audience Lenses** - Interactive selection for 4 archetypes (LW/Math, Engineer, Embodied, Buddhist-curious)
- **📱 Projects Showcase** - Featured cards for Lexion, CustomTales, and future projects
- **✍️ Writing Feed** - Substack integration with sample contemplative essays
- **🤝 Support Section** - Multiple ways to support: share, thank, donate (UPI/ETH), book time
- **🔗 Social Footer** - Interactive previews for all social platforms
- **🌙 Zen Theme** - Dark palette with dharma-inspired color scheme
- **📱 Responsive** - Mobile-first design with reduced motion support

### 🌅 Living Website Features (NEW)

The site is now **alive and time-aware** - it breathes with circadian rhythms and remembers visitors without tracking.

- **⏰ Circadian Time System** - Time-of-day is a first-class property that affects the entire atmosphere
  - Continuous phase mapping through night → dawn → day → dusk
  - Dynamic colors, animation speeds, and visual intensity based on local time
  - No toggle needed - the site just "feels" different at different times

- **🧠 Session Memory** - Privacy-respecting local memory system
  - Tracks visit count and familiarity level (newcomer → returning → familiar → intimate)
  - Remembers which content you've explored
  - Computes novelty scores for progressive content reordering
  - All data stays in localStorage - no server tracking

- **👁️ Behavior Detection** - Adapts to how you explore
  - Detects scroll speed (fast/medium/slow)
  - Measures hover depth (shallow/moderate/deep)
  - Tracks interaction density
  - Adjusts UI complexity based on engagement patterns

- **🌱 Progressive Disclosure** - Site reveals itself over time
  - First-time visitors see a clean, minimal interface
  - Returning visitors unlock deeper descriptions
  - Intimate visitors (5+ visits) get hidden insights and easter eggs
  - UI complexity adapts: minimal → standard → rich → maximal

- **🎨 Atmospheric Theming** - Visual atmosphere that changes with time
  - Night: Deep blues/violets, stars, slow meditative animations
  - Dawn: Warm gradients, gentle awakening, increasing energy
  - Day: High contrast, springy interactions, builder energy
  - Dusk: Gold to orange, glowing elements, contemplative mood

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure your settings**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual URLs and information.

3. **Run development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## ⚙️ Configuration

### Environment Variables

Edit `.env.local` to customize your site:

```bash
# Personal Information
NEXT_PUBLIC_NAME="Your Name"
NEXT_PUBLIC_EMAIL="your@email.com"
NEXT_PUBLIC_LOCATION="Your Location"

# Social Links
NEXT_PUBLIC_TWITTER_URL="https://twitter.com/yourusername"
NEXT_PUBLIC_GITHUB_URL="https://github.com/yourusername"
NEXT_PUBLIC_SUBSTACK_URL="https://yoursubstack.substack.com"

# Projects
NEXT_PUBLIC_LEXION_URL="https://your-lexion-demo.vercel.app"
NEXT_PUBLIC_CUSTOMTALES_URL="https://customtales.yourdomain.com"

# Support
NEXT_PUBLIC_UPI_ID="your-upi-id@provider"
NEXT_PUBLIC_ETH_ADDRESS="0xYourEthereumAddress"
NEXT_PUBLIC_BOOKING_LINK="https://calendly.com/yourusername"
```

### Site Configuration

Main configuration is in `src/lib/config.ts`. This centralizes all settings and provides helper functions.

### Content Customization

#### Updating Projects
Edit `src/components/ProjectsShowcase.tsx` to modify:
- Project descriptions and status
- Links to demos and repositories
- Featured project (currently Lexion)

#### Writing Content
Currently uses sample posts in `src/lib/substack.ts`. To integrate real Substack RSS:
1. Add RSS parsing logic to `fetchSubstackPosts()`
2. Set `SUBSTACK_RSS_URL` in environment variables

#### Support Options
Modify `src/components/SupportSection.tsx` to:
- Add/remove support methods
- Customize messaging and CTAs
- Update UPI/crypto addresses

## 🎨 Design System

### Colors
- **Zen palette**: Gray tones from `zen-50` to `zen-900`
- **Dharma palette**: Orange/amber tones from `dharma-50` to `dharma-900`
- **Glass effects**: Semi-transparent cards with backdrop blur

### Typography
- **Primary**: Inter font family
- **Mono**: JetBrains Mono for code
- **Weights**: Light (300) for headings, Regular (400) for body

### Animations
- **Dharma wheel**: 60-second rotation cycle
- **Hover effects**: Subtle scale and transform
- **Scroll animations**: Framer Motion with `whileInView`
- **Accessibility**: Respects `prefers-reduced-motion`

## 🛠️ Development

### Project Structure
```
src/
├── app/                 # Next.js 14 app directory
│   ├── globals.css     # Global styles and CSS variables
│   ├── layout.tsx      # Root layout with providers
│   └── page.tsx        # Main homepage
├── components/         # React components
│   ├── DharmaWheel.tsx              # Animated SVG wheel
│   ├── HeroSection.tsx              # Hero with wheel and intro
│   ├── AudienceLenses.tsx           # Interactive archetype selection
│   ├── ProjectsShowcase.tsx         # Featured and grid projects
│   ├── WritingSection.tsx           # Substack feed display
│   ├── SupportSection.tsx           # Support/donation options
│   ├── Footer.tsx                   # Social links footer
│   ├── CircadianBackground.tsx      # Time-aware atmospheric layer
│   ├── AdaptiveProjectCard.tsx      # Progressive disclosure demo
│   ├── AtmosphereDebugPanel.tsx     # Debug panel (Alt+D)
│   └── WanderingDharmaWheel.tsx     # Background wheel with physics
├── contexts/           # React contexts
│   ├── LensContext.tsx              # Audience lens state
│   └── AtmosphereContext.tsx        # Circadian + memory state
└── lib/                # Utilities and configuration
    ├── config.ts       # Site configuration and helpers
    ├── substack.ts     # RSS utilities and sample data
    ├── circadian.ts    # Time-of-day system and theming
    └── memory.ts       # Session memory and behavior tracking
```

### Adding New Sections

1. Create component in `src/components/`
2. Import and add to `src/app/page.tsx`
3. Update configuration if needed
4. Add to git with clear commit message

### Deployment

The site is configured for Vercel deployment:

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - automatic on git push

For other platforms, build with:
```bash
npm run build
npm start
```

## ✅ Testing & Quality Assurance

### Manual Testing Checklist for Living Website Features

The circadian and memory systems work silently in the background. Here's how to verify they're working:

#### 1. **Circadian Time System**

**Test atmospheric changes:**
- [ ] Open the debug panel with `Alt+D`
- [ ] Check "Circadian State" section shows current time and phase
- [ ] Verify phase matches actual time:
  - Night: 22:00-05:00 (deep blues, stars visible)
  - Dawn: 05:00-09:00 (warm gradients, gentle glow)
  - Day: 09:00-17:00 (bright, high energy)
  - Dusk: 17:00-22:00 (golden tones, contemplative)
- [ ] Watch energy/warmth/luminance bars update
- [ ] Verify background gradient changes smoothly
- [ ] Check that stars appear during night/dusk phases

**Test theme application:**
- [ ] Open browser DevTools → Elements → `<html>`
- [ ] Check CSS variables are set:
  - `--circadian-bg-start`
  - `--circadian-bg-end`
  - `--circadian-accent`
  - `--circadian-glow`
  - `--circadian-speed`
  - `--circadian-intensity`
- [ ] Verify `data-circadian-phase` attribute on `<html>` element

**Simulate different times (for testing):**
```javascript
// In browser console:
// Temporarily override getCurrentCircadianState in /lib/circadian.ts
// Or change your system time and reload the page
```

#### 2. **Session Memory System**

**Test visit tracking:**
- [ ] Open site in incognito window (first visit)
- [ ] Open debug panel (`Alt+D`)
- [ ] Verify "Visit Count" shows 1
- [ ] Verify "Familiarity" shows "newcomer"
- [ ] Close and reopen (same incognito window)
- [ ] Verify visit count increments to 2
- [ ] Verify familiarity changes to "returning"

**Test seen content tracking:**
- [ ] Hover over a project card for 3+ seconds
- [ ] In debug panel, check "Seen Nodes" count increases
- [ ] Verify novelty indicators (dots) appear on unseen content
- [ ] After hovering, dot should disappear

**Test localStorage persistence:**
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Find key `portfolio_memory`
- [ ] Verify JSON contains:
  - `visitCount`
  - `firstVisit` (timestamp)
  - `lastVisit` (timestamp)
  - `seenNodes` (array of IDs)
  - `interactions` (object with counts)

**Test memory reset:**
```javascript
// In browser console:
localStorage.removeItem('portfolio_memory')
// Reload page - should be back to visit 1
```

#### 3. **Behavior Detection**

**Test scroll tracking:**
- [ ] Open debug panel
- [ ] Scroll rapidly → "Scroll Speed" should show "fast"
- [ ] Scroll slowly → should show "slow"
- [ ] Stop scrolling → should stabilize to "medium"

**Test hover tracking:**
- [ ] Quick hover (< 0.5s) → "Hover Depth" shows "shallow"
- [ ] Medium hover (0.5-2s) → shows "moderate"
- [ ] Deep hover (> 2s) → shows "deep"
- [ ] Watch "Session Duration" and "Interactions/min" update

**Test UI complexity adaptation:**
- [ ] Fast scroll through page → "UI Complexity" should be "minimal"
- [ ] Slow exploration + deep hovers → should increase to "standard" or "rich"
- [ ] After 5+ visits → should reach "maximal"

#### 4. **Progressive Disclosure**

**Test as newcomer (visit 1):**
- [ ] Clear localStorage (incognito mode)
- [ ] Verify minimal UI:
  - No "hidden insights" sections
  - Fewer tags shown on cards
  - Simpler animations

**Test as returning (visits 2-3):**
- [ ] Reload 2-3 times
- [ ] Check debug panel shows "returning"
- [ ] Look for deeper descriptions appearing on cards
- [ ] Verify UI has slightly more detail

**Test as intimate (5+ visits):**
- [ ] Reload 5+ times (or manually set in localStorage)
- [ ] Check for "hidden insights" sections
- [ ] Verify "Show Advanced" toggle in debug panel is true
- [ ] All features should be visible

#### 5. **Integration Testing**

**Test context providers:**
- [ ] Open React DevTools → Components
- [ ] Find `AtmosphereProvider` component
- [ ] Verify it wraps `LensProvider`
- [ ] Check context values are propagating

**Test CSS variable application:**
- [ ] Inspect any element with circadian theming
- [ ] Verify it uses CSS variables like `var(--circadian-accent)`
- [ ] Change time of day → colors should update

**Test performance:**
- [ ] Open DevTools → Performance
- [ ] Record while scrolling
- [ ] Check for smooth 60fps animations
- [ ] Verify no memory leaks in long sessions

#### 6. **Debug Panel Features**

**Test debug panel:**
- [ ] Press `Alt+D` → panel should slide in from right
- [ ] Press `Alt+D` again → panel should slide out
- [ ] Click floating eye icon → same behavior
- [ ] Verify all metrics update in real-time:
  - Circadian values
  - Memory stats
  - Behavior metrics
  - Theme colors
- [ ] Check color swatches match actual theme

**Test keyboard shortcut:**
- [ ] With panel closed, press `Alt+D`
- [ ] Verify panel opens
- [ ] Press `Alt+D` while panel open
- [ ] Verify panel closes

#### 7. **Cross-Browser Testing**

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

Verify:
- [ ] localStorage works
- [ ] CSS variables apply
- [ ] Animations are smooth
- [ ] Debug panel keyboard shortcut works

#### 8. **Error Handling**

**Test localStorage disabled:**
```javascript
// Simulate localStorage being blocked
Object.defineProperty(window, 'localStorage', {
  get() { throw new Error('localStorage disabled') }
})
// Reload - should gracefully fallback without crashing
```

**Test SSR/hydration:**
- [ ] Check browser console for hydration errors
- [ ] Verify no flash of unstyled content
- [ ] Confirm server-rendered HTML is valid

### Automated Testing Notes

Currently manual testing only. Future additions:
- Unit tests for `circadian.ts` and `memory.ts`
- Integration tests for context providers
- E2E tests for user flows
- Visual regression tests for theme changes

## 🔧 Customization Ideas

### Audience Lens Personalization
Currently the lenses are visual-only. You could:
- Store selection in localStorage
- Reorder sections based on selected lens
- Show different content for each archetype
- Add analytics tracking for lens usage

### Real RSS Integration
Replace sample posts with live Substack data:
```typescript
// In src/lib/substack.ts
export async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  const response = await fetch('/api/rss')
  const data = await response.json()
  return data.posts
}
```

### Analytics Integration
Add Plausible or other privacy-focused analytics:
```typescript
// In src/app/layout.tsx
{process.env.NODE_ENV === 'production' && (
  <script defer data-domain="yourdomain.com" src="https://plausible.io/js/plausible.js"></script>
)}
```

### CustomTales Integration
Create a dedicated subdomain handler:
```typescript
// In src/app/customtales/page.tsx
export default function CustomTalesPage() {
  // Story exploration interface
}
```

## 🤝 Contributing

This is a personal portfolio, but if you're inspired to create your own version:

1. Fork the repository
2. Customize the content and design
3. Update environment variables
4. Deploy to your preferred platform

## 📝 License

This project is open source. Feel free to learn from and adapt the code for your own portfolio.

## 🔬 Technical Implementation Details

### Circadian System Architecture

**Core files:**
- `src/lib/circadian.ts` - Time calculation and theme generation
- `src/contexts/AtmosphereContext.tsx` - React context provider
- `src/components/CircadianBackground.tsx` - Visual layer

**How it works:**
1. `getCurrentCircadianState()` computes current time phase
2. Calculates atmospheric properties (energy, warmth, luminance, contemplation)
3. `getCircadianTheme()` generates colors and animation speeds
4. Context updates every 60 seconds
5. CSS variables applied to `:root` element
6. All components can read theme via `useAtmosphere()` hook

**Key functions:**
```typescript
// Get current state
const state = getCurrentCircadianState()
// Returns: { phase, energy, warmth, luminance, contemplation, ... }

// Generate theme from state
const theme = getCircadianTheme(state)
// Returns: { background, accent, glow, speed, intensity, ... }
```

### Memory System Architecture

**Core files:**
- `src/lib/memory.ts` - localStorage operations and behavior tracking
- `src/contexts/AtmosphereContext.tsx` - React integration

**Data structure in localStorage:**
```json
{
  "visitCount": 5,
  "firstVisit": 1234567890000,
  "lastVisit": 1234567890000,
  "seenNodes": ["lexion", "customtales"],
  "interactions": {
    "lexion": 3,
    "customtales": 1
  },
  "preferences": {
    "selectedLens": "engineer"
  }
}
```

**Key functions:**
```typescript
// Track visit
const memory = recordVisit()

// Mark content as seen
markNodeSeen('project-id')

// Get novelty score (0-1)
const novelty = getNoveltyScore('project-id')

// Track behavior
trackScroll()
trackHover(duration)
trackInteraction()
```

### Behavior Detection

**Metrics tracked:**
- Scroll events (last 10 seconds)
- Hover durations (last 20 events)
- Interaction count
- Session duration

**Adaptive UI logic:**
```typescript
// Fast scrollers get minimal UI
if (scrollSpeed === 'fast') {
  uiComplexity = 'minimal'
}

// Deep explorers get rich UI
if (hoverDepth === 'deep' && interactionDensity > 3) {
  uiComplexity = 'rich'
}

// Intimate visitors get maximal
if (visitCount >= 5) {
  uiComplexity = 'maximal'
}
```

### React Context Integration

**Provider hierarchy:**
```tsx
<AtmosphereProvider>  {/* Outermost */}
  <LensProvider>
    <App />
  </LensProvider>
</AtmosphereProvider>
```

**Using the context:**
```tsx
import { useAtmosphere } from '@/contexts/AtmosphereContext'

function MyComponent() {
  const {
    circadian,        // Current time state
    theme,           // Generated theme
    memory,          // Visit history
    familiarityLevel,// newcomer/returning/familiar/intimate
    behavior,        // Current session metrics
    uiComplexity,    // minimal/standard/rich/maximal
    markSeen,        // Function to mark content seen
    getNovelty,      // Function to get novelty score
  } = useAtmosphere()

  return <div style={{ color: theme.accent }}>...</div>
}
```

### CSS Variables Reference

Applied to `:root` element:
```css
--circadian-bg-start: hsl(...);       /* Background gradient start */
--circadian-bg-end: hsl(...);         /* Background gradient end */
--circadian-accent: hsl(...);         /* Primary accent color */
--circadian-glow: hsl(...);           /* Glow/highlight color */
--circadian-text-primary: hsl(...);   /* Primary text color */
--circadian-text-secondary: hsl(...); /* Secondary text color */
--circadian-speed: 1.0;               /* Animation speed multiplier */
--circadian-intensity: 1.0;           /* Interaction intensity */
--circadian-particles: 0.5;           /* Particle density (0-1.5) */
--circadian-blur: 2px;                /* Atmospheric blur amount */
```

**Usage in components:**
```tsx
<div style={{
  backgroundColor: 'var(--circadian-accent)',
  animationDuration: `calc(2s / var(--circadian-speed))`
}} />
```

### Performance Considerations

**Update intervals:**
- Circadian state: 60 seconds
- Behavior metrics: 5 seconds
- CSS variables: On state change only

**Optimization tips:**
- Use `useMemo` for expensive theme calculations
- Debounce scroll/hover tracking
- Limit localStorage writes
- Use CSS transitions instead of re-renders

**Memory usage:**
- localStorage: < 1KB per user
- Context state: ~500 bytes
- Stars/particles: Scales with `particleDensity`

### Extending the System

**Adding new circadian phases:**
1. Update phase boundaries in `getPhaseInfo()`
2. Add theme in `getCircadianTheme()` switch statement
3. Update atmospheric properties calculations

**Adding new memory metrics:**
1. Extend `MemoryState` interface in `memory.ts`
2. Add tracking functions
3. Update `getMemoryState()` to persist new fields

**Creating adaptive components:**
```tsx
function MyAdaptiveComponent() {
  const { familiarityLevel, uiComplexity } = useAtmosphere()

  if (familiarityLevel === 'newcomer') {
    return <SimpleVersion />
  }

  if (uiComplexity === 'maximal') {
    return <RichVersion />
  }

  return <StandardVersion />
}
```

## 🙏 Acknowledgments

- **Design inspiration**: Zen Buddhism and contemplative practice, Bret Victor's explorable explanations
- **Technical stack**: Next.js, Tailwind CSS, Framer Motion
- **Philosophy**: Building bridges between different ways of knowing
- **Living websites**: Time as atmosphere, progressive disclosure, behavioral adaptation

---

Built with ❤️ and contemplative attention. May this work help connect communities and foster understanding across different traditions and practices.

The site remembers you, breathes with the day, and reveals itself slowly - just as relationships do.