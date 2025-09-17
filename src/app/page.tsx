import HeroSection from '@/components/HeroSection'
import AudienceLenses from '@/components/AudienceLenses'
import ProjectsShowcase from '@/components/ProjectsShowcase'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AudienceLenses />
      <ProjectsShowcase />
    </main>
  )
}