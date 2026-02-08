import { portfolioData } from "@/data/portfolio"
import { Card, CardContent } from "@/components/ui/card"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function Education() {
    const sectionRef = useScrollAnimation()
    return (
        <section id="education" className="py-20 relative" ref={sectionRef}>
            <div className="container px-4 mx-auto max-w-4xl">
                <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center flex items-center justify-center gap-3">
                    <span className="w-12 h-1 bg-primary/30 rounded-full"></span>
                    <span className="border-b-4 border-primary pb-2">Academic Background</span>
                    <span className="w-12 h-1 bg-primary/30 rounded-full"></span>
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    {portfolioData.academics.map((edu, index) => (
                        <Card key={index} className="bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                            <CardContent className="p-6 flex flex-col h-full justify-center">
                                <h4 className="font-bold text-lg text-primary">{edu.degree}</h4>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{edu.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
