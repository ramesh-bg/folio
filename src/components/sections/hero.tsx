import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { Button } from "@/components/ui/button"
import { portfolioData } from "@/data/portfolio"

export function Hero() {
    const titleRef = useRef<HTMLHeadingElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

        if (titleRef.current) {
            tl.fromTo(titleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1 }
            )
        }

        if (subtitleRef.current) {
            tl.fromTo(subtitleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.5"
            )
        }

        if (ctaRef.current) {
            tl.fromTo(ctaRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                "-=0.5"
            )
        }
    }, [])

    return (
        <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16">
            <div className="container px-4 mx-auto text-center z-10">
                <h1
                    ref={titleRef}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-400 dark:from-green-500 dark:to-green-300 drop-shadow-sm"
                >
                    {portfolioData.personal.name}
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light"
                >
                    {portfolioData.personal.title} <br />
                    <span className="text-primary font-mono text-sm md:text-base mt-2 block">
                        {portfolioData.personal.bio}
                    </span>
                </p>

                <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button size="lg" className="rounded-full px-8 text-lg" asChild>
                        <a href="#projects">View Projects</a>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 text-lg" asChild>
                        <a href="#contact">Contact Me</a>
                    </Button>
                </div>
            </div>

            {/* Decorative Grid or Elements could go here */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <div className="animate-bounce">
                    <span className="text-muted-foreground text-sm font-medium tracking-widest uppercase opacity-70">Scroll Down</span>
                </div>
            </div>
        </section>
    )
}
