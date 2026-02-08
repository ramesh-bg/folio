import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [logoText, setLogoText] = useState("")
    const [showCursor, setShowCursor] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Typing effect
    useEffect(() => {
        const text = "<RameshBG />"
        let currentIndex = 0

        const startTimeout = setTimeout(() => {
            const typingInterval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setLogoText(text.slice(0, currentIndex))
                    currentIndex++
                } else {
                    clearInterval(typingInterval)
                }
            }, 100)

            return () => clearInterval(typingInterval)
        }, 500)

        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev)
        }, 500)

        return () => {
            clearTimeout(startTimeout)
            clearInterval(cursorInterval)
        }
    }, [])

    const navItems = ["About", "Skills", "Experience", "Projects", "Contact"]

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-background/80 backdrop-blur-md border-b border-border/40 py-2 shadow-sm"
                    : "bg-transparent py-4"
            )}
        >
            <div className="container mx-auto px-4 flex justify-between items-center">
                <a
                    href="#"
                    className="text-2xl font-bold font-mono tracking-tighter text-primary min-w-[150px] relative z-50 group"
                    onMouseEnter={() => {
                        const originalText = "<RameshBG />";
                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()";
                        let iterations = 0;
                        const interval = setInterval(() => {
                            setLogoText(originalText.split("")
                                .map((_, index) => {
                                    if (index < iterations) return originalText[index];
                                    return chars[Math.floor(Math.random() * chars.length)];
                                })
                                .join(""));

                            if (iterations >= originalText.length) clearInterval(interval);
                            iterations += 1 / 3; // Slower decoding
                        }, 50); // Slower frame rate
                    }}
                >
                    {logoText}
                    <span className={cn("inline-block w-2.5 h-5 bg-primary ml-1 align-middle animate-pulse", showCursor ? "opacity-100" : "opacity-0")}></span>
                </a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-1">
                    {navItems.map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="relative px-4 py-2 text-sm font-medium transition-colors group"
                        >
                            <span className="relative z-10 text-muted-foreground group-hover:text-primary transition-colors font-mono uppercase tracking-wider">
                                {item}
                            </span>
                            <span className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-md -z-0 origin-center"></span>
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                        </a>
                    ))}
                    <div className="ml-4 pl-4 border-l border-border">
                        <ModeToggle />
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-4 z-50">
                    <ModeToggle />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-primary p-2"
                    >
                        <div className={cn("w-6 h-0.5 bg-current transition-all duration-300", mobileMenuOpen ? "rotate-45 translate-y-1.5" : "mb-1.5")}></div>
                        <div className={cn("w-6 h-0.5 bg-current transition-all duration-300", mobileMenuOpen ? "opacity-0" : "mb-1.5")}></div>
                        <div className={cn("w-6 h-0.5 bg-current transition-all duration-300", mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : "")}></div>
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 md:hidden shadow-lg flex flex-col gap-4"
                        >
                            {navItems.map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-medium text-center py-2 hover:text-primary transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}
