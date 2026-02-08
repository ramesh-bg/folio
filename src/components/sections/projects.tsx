import { portfolioData } from "@/data/portfolio"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function Projects() {
    const sectionRef = useScrollAnimation()
    return (
        <section id="projects" className="py-20 bg-secondary/20" ref={sectionRef}>
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                    <span className="border-b-4 border-primary pb-2">Projects</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioData.projects.map((project, index) => (
                        <Card key={index} className="h-full flex flex-col group hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="group-hover:text-primary transition-colors">{project.title}</CardTitle>
                                <CardDescription className="font-mono text-xs uppercase tracking-wider text-green-600/70 dark:text-green-400/70">
                                    {project.category}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {project.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
