import { portfolioData } from "@/data/portfolio"
import { Badge } from "@/components/ui/badge"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function Skills() {
    const sectionRef = useScrollAnimation()
    return (
        <section id="skills" className="py-20 bg-secondary/10" ref={sectionRef}>
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
                    <span className="border-b-4 border-primary pb-2">Skills</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    {portfolioData.skills.map((skillGroup, index) => (
                        <div
                            key={index}
                            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm"
                        >
                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-2 text-primary">{skillGroup.category}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {skillGroup.description}
                                </p>
                            </div>

                            {/* Logos Grid - No grayscale, improved hover */}
                            {skillGroup.logos && (
                                <div className="flex flex-wrap gap-4 mb-6">
                                    {skillGroup.logos.map((logo, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative w-12 h-12 flex items-center justify-center bg-background/50 rounded-lg border border-border/50 p-2 hover:border-primary transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
                                            title={logo.name}
                                        >
                                            <img src={logo.url} alt={logo.name} className="w-full h-full object-contain transition-all duration-300" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {skillGroup.items.map((item, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-secondary/40 hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                                    >
                                        {item}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
