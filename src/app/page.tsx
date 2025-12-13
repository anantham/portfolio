import HeroSection from '@/components/HeroSection'
import AudienceLenses from '@/components/AudienceLenses'
import ProjectsShowcase from '@/components/ProjectsShowcase'
// import WritingSection from '@/components/WritingSection'
import SupportSection from '@/components/SupportSection'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AudienceLenses />
      <ProjectsShowcase />
      {/* <WritingSection /> */}
      <SupportSection />
    </main>
  )
}