import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"
import { Terminal, X, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const CYBER_PALETTE = [
    { name: "matrix", hue: 120 },
    { name: "cyan", hue: 180 },
    { name: "purple", hue: 270 },
    { name: "ember", hue: 0 },
    { name: "gold", hue: 45 },
    { name: "silver", hue: 200 },
]

type LogEntry = {
    id: string;
    text: React.ReactNode;
    type: "input" | "system" | "error" | "success";
}

export function SystemOverride() {
    const { themeHue, setThemeHue } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState("")
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: "1", text: "SYS.CMD terminal ready.", type: "system" },
        { id: "2", text: "Type 'help' for available commands.", type: "system" }
    ])
    
    const inputRef = useRef<HTMLInputElement>(null)
    const logContainerRef = useRef<HTMLDivElement>(null)

    // Current active preset for the button label
    const activePreset = CYBER_PALETTE.find(p => p.hue.toString() === themeHue)
    const buttonLabel = activePreset ? `sys.${activePreset.name}` : `sys.hue_${themeHue}`

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Scroll to bottom of logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
    }, [logs])

    // Add a log
    const addLog = (text: React.ReactNode, type: LogEntry["type"]) => {
        setLogs(prev => [...prev, { id: Math.random().toString(36).substring(7), text, type }])
    }

    const processCommand = (cmd: string) => {
        const trimmedCmd = cmd.trim().toLowerCase()
        if (!trimmedCmd) return
        
        addLog(`> ${cmd}`, "input")
        
        const args = trimmedCmd.split(" ")
        const action = args[0]
        
        switch (action) {
            case "help":
                addLog(
                    <div className="flex flex-col gap-1">
                        <span>AVAILABLE COMMANDS:</span>
                        <span>- <span className="text-white">theme [color/hue]</span> : Change system color</span>
                        <span>- <span className="text-white">list</span> : Show preset colors</span>
                        <span>- <span className="text-white">clear</span> : Clear console</span>
                        <span>- <span className="text-white">exit</span> : Close terminal</span>
                    </div>, 
                    "system"
                )
                break;
            case "list":
                addLog(
                    <div className="flex flex-col gap-1 mt-1">
                        <span>PRESET COLOR SCHEMES:</span>
                        {CYBER_PALETTE.map(p => (
                            <span key={p.name}>- {p.name} (hue: {p.hue})</span>
                        ))}
                        <span className="text-primary/70 mt-1">You can also use 'theme default' or any hue between 0-360.</span>
                    </div>,
                    "system"
                )
                break;
            case "clear":
                setLogs([])
                break;
            case "exit":
                setIsOpen(false)
                break;
            case "theme":
            case "color":
            case "inject":
                if (args.length < 2) {
                    addLog("Error: Missing argument. Usage: theme [color/hue]", "error")
                    return
                }
                const target = args[1]
                
                // Allow "default" alias for matrix
                const lookupName = target === "default" ? "matrix" : target
                const preset = CYBER_PALETTE.find(p => p.name === lookupName)
                
                if (preset) {
                    setThemeHue(preset.hue.toString())
                    addLog(`Theme applied: ${preset.name.toUpperCase()} (hue: ${preset.hue})`, "success")
                } else if (!isNaN(Number(target)) && Number(target) >= 0 && Number(target) <= 360) {
                    setThemeHue(target)
                    addLog(`Theme hue applied manually: ${target}`, "success")
                } else {
                    addLog(`Error: Unknown color or invalid hue '${target}'. Use 'list' to see presets.`, "error")
                }
                break;
            case "sudo":
                addLog("Nice try. This incident will be reported.", "error")
                break;
            default:
                addLog(`Command not found: ${action}. Type 'help' for commands.`, "error")
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        processCommand(input)
        setInput("")
    }

    // Handle pressing Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-4 w-[340px] md:w-[400px] border border-primary/50 bg-black/95 shadow-[0_0_30px_hsl(var(--primary)/0.2)] backdrop-blur-xl overflow-hidden font-mono text-sm"
                    >
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between border-b border-primary/30 bg-primary/10 px-3 py-2 cursor-default select-none">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold tracking-widest text-primary uppercase">sys.cmd</span>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-primary/70 hover:text-primary transition-colors focus:outline-none"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Terminal Body */}
                        <div 
                            ref={logContainerRef}
                            className="p-3 h-[250px] md:h-[300px] overflow-y-auto flex flex-col gap-2 relative style-scrollbar"
                            style={{ scrollBehavior: 'smooth' }}
                        >
                            {/* Scanline effect */}
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-50" />
                            
                            <div className="z-20 flex flex-col gap-2">
                                {logs.map(log => (
                                    <div 
                                        key={log.id} 
                                        className={`
                                            ${log.type === "system" ? "text-primary/80" : ""}
                                            ${log.type === "input" ? "text-white" : ""}
                                            ${log.type === "error" ? "text-red-500" : ""}
                                            ${log.type === "success" ? "text-primary font-bold shadow-primary drop-shadow-md" : ""}
                                        `}
                                    >
                                        {log.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terminal Input Footer */}
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-2 border-t border-primary/30 bg-black/80 p-2 z-20">
                            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                            <input 
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full bg-transparent outline-none text-white placeholder-primary/30 font-mono text-sm leading-tight h-6"
                                placeholder="Enter command..."
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest border border-primary/50 bg-black/80 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-black hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] group overflow-hidden relative"
                    aria-label="Open Terminal"
                >
                    {/* Background hover effect */}
                    <div className="absolute inset-0 bg-primary/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    
                    <Terminal className="w-4 h-4 group-hover:animate-pulse relative z-10" />
                    <span className="relative z-10 text-[10px] sm:text-xs min-w-[70px] text-left">{buttonLabel}</span>
                    <span className="w-2 h-4 bg-primary animate-pulse ml-1 opacity-70 relative z-10" />
                </button>
            )}
        </div>
    )
}
