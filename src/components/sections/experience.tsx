import { useRef, useEffect } from "react"
import { portfolioData } from "@/data/portfolio"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import gsap from "gsap"

export function Experience() {
    const sectionRef = useScrollAnimation()
    const openFinancialRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = openFinancialRef.current
        if (!element) return

        gsap.to(element, {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            ease: "sine.inOut"
        })
    }, [])

    return (
        <section id="experience" className="py-20 relative overflow-hidden" ref={sectionRef}>
            {/* Background elements */}
            <div className="absolute inset-0 bg-secondary/5 -z-10"></div>

            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
                    <span className="border-b-4 border-primary pb-2">Experience</span>
                </h2>

                <div className="flex flex-col gap-12 max-w-4xl mx-auto relative">
                    {/* Vertical connecting line for desktop - Animated Timeline */}
                    <div className="absolute left-[28px] top-[40px] bottom-[100px] w-0.5 bg-border hidden md:block">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary via-primary/50 to-transparent origin-top animate-pulse"></div>
                    </div>

                    {portfolioData.experience.map((job, index) => {
                        const isCurrent = job.period === "Present";
                        const isOpenFinancial = job.company.includes("Open Financial Technologies");

                        return (
                            <div key={index} className="flex flex-col md:flex-row gap-8 relative group">
                                {/* Timeline visual marker - Custom Logo Stepper */}
                                <div className="hidden md:flex flex-col items-center z-10">
                                    <div ref={isOpenFinancial ? openFinancialRef : null} className={cn(
                                        "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background",
                                        isCurrent
                                            ? "border-primary shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110"
                                            : "border-border/50 group-hover:border-primary/50"
                                    )}>
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center p-1.5">
                                            {job.logo && (
                                                <img
                                                    src={job.logo}
                                                    alt={job.company}
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <Card className={cn(
                                        "flex-1 border-primary/10 bg-card/80 backdrop-blur-sm transition-all duration-300 shadow-lg border-l-4",
                                        isCurrent ? "border-l-primary" : "border-l-transparent hover:border-l-primary/50",
                                        isOpenFinancial && "border-primary/50"
                                    )}>
                                        <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <CardTitle className="text-xl font-bold leading-tight flex items-center gap-3">
                                                        {job.role}
                                                        {isCurrent && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 animate-pulse">
                                                                Active
                                                            </span>
                                                        )}
                                                    </CardTitle>
                                                    <a
                                                        href={job.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary font-medium hover:underline decoration-primary/50 underline-offset-4 text-lg mt-1 block"
                                                    >
                                                        {job.company}
                                                    </a>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-primary/5 text-primary/80 px-3 py-1 rounded-full border border-primary/10 self-start md:self-auto whitespace-nowrap">
                                                    <Calendar size={14} />
                                                    <span>{job.duration}</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-5">
                                            <p className="text-muted-foreground leading-relaxed text-base">
                                                {job.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}
