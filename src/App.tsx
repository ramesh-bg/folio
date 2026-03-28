import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
import { CanvasBackground } from "@/components/layout/canvas-background"
import { SystemOverride } from "@/components/system-override"
import { Hero } from "@/components/sections/hero"
import { About } from "@/components/sections/about"
import { Skills } from "@/components/sections/skills"
import { Experience } from "@/components/sections/experience"
import { Projects } from "@/components/sections/projects"
import { Education } from "@/components/sections/education"
import { Contact } from "@/components/sections/contact"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="relative min-h-screen text-foreground selection:bg-primary selection:text-primary-foreground">
        <CanvasBackground />
        <Navbar />
        <SystemOverride />

        <main className="flex flex-col w-full">
          <Hero />
          <About />
          <Skills />
          <Experience />
          <Projects />
          <Education />
          <Contact />
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
