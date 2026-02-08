import { portfolioData } from "@/data/portfolio"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Linkedin, FileText } from "lucide-react"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function Contact() {
    const sectionRef = useScrollAnimation()
    return (
        <section id="contact" className="py-20 bg-background relative overflow-hidden" ref={sectionRef}>
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"></div>

            <div className="container px-4 mx-auto max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                    <span className="border-b-4 border-primary pb-2">Get In Touch</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-10 items-start">
                    {/* Contact Info Column */}
                    <div className="space-y-6">
                        {/* Clean Cards for Email & Phone */}
                        <div className="space-y-4">
                            <a
                                href={`mailto:${portfolioData.personal.email}`}
                                className="flex items-center gap-4 p-5 rounded-2xl bg-secondary/30 border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                            >
                                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                                    <p className="font-mono font-medium text-lg">{portfolioData.personal.email}</p>
                                </div>
                            </a>

                            <a
                                href={`tel:${portfolioData.personal.phone}`}
                                className="flex items-center gap-4 p-5 rounded-2xl bg-secondary/30 border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                            >
                                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
                                    <p className="font-mono font-medium text-lg">{portfolioData.personal.phone}</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Social & Resume Column - Redesigned */}
                    <div className="flex flex-col justify-center h-full gap-6">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                            Social Profiles & Resume
                        </h3>

                        <div className="flex flex-col gap-4">
                            <a href={portfolioData.personal.linkedin} target="_blank" rel="noopener noreferrer" className="block">
                                <Button variant="outline" className="w-full h-14 justify-start px-6 gap-4 text-lg font-medium border-primary/20 hover:border-primary/50 hover:bg-primary/5 group">
                                    <Linkedin className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                    LinkedIn
                                </Button>
                            </a>

                            {/* Check if github exists in data, else fallback or use just resume */}

                            <a href={portfolioData.personal.resume} target="_blank" rel="noopener noreferrer" className="block">
                                <Button variant="default" className="w-full h-14 justify-start px-6 gap-4 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 group">
                                    <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    Download Resume
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
