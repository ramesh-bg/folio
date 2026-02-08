import { useEffect, useState } from "react"

export function Terminal() {
    const [text, setText] = useState("")
    const fullText = `> Initializing system...
> Loading profile...
> User: Ramesh BG
> Role: Software Engineer
> Stacks: [Angular, React, Node.js]
> Status: Online.
`

    useEffect(() => {
        let index = 0
        let currentText = ""
        let interval: any

        const startTyping = () => {
            index = 0
            currentText = ""
            setText("")

            interval = setInterval(() => {
                if (index < fullText.length) {
                    currentText += fullText.charAt(index)
                    setText(currentText)
                    index++
                } else {
                    clearInterval(interval)
                    // Wait 3 seconds then restart
                    setTimeout(startTyping, 3000)
                }
            }, 50)
        }

        startTyping()

        return () => {
            clearInterval(interval)
        }
    }, [])

    return (
        <div className="w-full rounded-lg overflow-hidden border border-border bg-black/90 shadow-2xl font-mono text-sm sm:text-base">
            <div className="bg-secondary/20 px-4 py-2 flex items-center gap-2 border-b border-border/50">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-muted-foreground">bash -- 80x24</span>
            </div>
            <div className="p-6 h-auto min-h-[250px] md:h-[300px] overflow-hidden md:overflow-y-auto text-green-500 font-mono text-sm leading-relaxed scrollbar-hide">
                <pre className="whitespace-pre-wrap font-mono">
                    {text}
                    <span className="animate-pulse">_</span>
                </pre>
            </div>
        </div>
    )
}
