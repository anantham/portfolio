# Aditya's Portfolio - Building Bridges to Niche Subcultures

A zen-inspired personal portfolio website built with Next.js, featuring contemplative design, interactive audience lenses, and deep integration with your creative work.

## ✨ Features

- **🎡 Dharma Wheel Hero** - Slowly rotating SVG wheel representing the Noble Eightfold Path
- **🎯 Audience Lenses** - Interactive selection for 4 archetypes (LW/Math, Engineer, Embodied, Buddhist-curious)
- **📱 Projects Showcase** - Featured cards for Lexion, CustomTales, and future projects
- **✍️ Writing Feed** - Substack integration with sample contemplative essays
- **🤝 Support Section** - Multiple ways to support: share, thank, donate (UPI/ETH), book time
- **🔗 Social Footer** - Interactive previews for all social platforms
- **🌙 Zen Theme** - Dark palette with dharma-inspired color scheme
- **📱 Responsive** - Mobile-first design with reduced motion support

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
│   ├── layout.tsx      # Root layout with footer
│   └── page.tsx        # Main homepage
├── components/         # React components
│   ├── DharmaWheel.tsx        # Animated SVG wheel
│   ├── HeroSection.tsx        # Hero with wheel and intro
│   ├── AudienceLenses.tsx     # Interactive archetype selection
│   ├── ProjectsShowcase.tsx   # Featured and grid projects
│   ├── WritingSection.tsx     # Substack feed display
│   ├── SupportSection.tsx     # Support/donation options
│   └── Footer.tsx             # Social links footer
└── lib/                # Utilities and configuration
    ├── config.ts       # Site configuration and helpers
    └── substack.ts     # RSS utilities and sample data
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

## 🙏 Acknowledgments

- **Design inspiration**: Zen Buddhism and contemplative practice
- **Technical stack**: Next.js, Tailwind CSS, Framer Motion
- **Philosophy**: Building bridges between different ways of knowing

---

Built with ❤️ and contemplative attention. May this work help connect communities and foster understanding across different traditions and practices.