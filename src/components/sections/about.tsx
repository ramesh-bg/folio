import { portfolioData } from "@/data/portfolio"
import { Terminal } from "@/components/ui/terminal"
import { Landmark, Zap, Server, Code2 } from "lucide-react"
import { motion } from "framer-motion"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function About() {
    const sectionRef = useScrollAnimation()
    return (
        <section id="about" className="py-20 relative" ref={sectionRef}>
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                    <span className="border-b-4 border-primary pb-2">About Me</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg leading-relaxed text-muted-foreground">
                            {portfolioData.personal.about}
                        </p>

                        {/* Focus Areas / Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            {[
                                { title: "Enterprise Architecture", icon: Landmark, color: "text-blue-500" },
                                { title: "Frontend Performance", icon: Zap, color: "text-yellow-500" },
                                { title: "Scalable Systems", icon: Server, color: "text-purple-500" },
                                { title: "Clean Code", icon: Code2, color: "text-green-500" }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className={`p-2 rounded-full bg-background/50 ${item.color}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="font-medium text-sm">{item.title}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative group [perspective:1000px] overflow-visible">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative transform transition-transform duration-500 hover:scale-[1.02]">
                            <Terminal />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}
