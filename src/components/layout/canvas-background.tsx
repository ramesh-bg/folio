import { useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"

/**
 * Convert HSL to RGB.
 * h: 0-360, s: 0-100, l: 0-100
 * Returns [r, g, b] each 0-255
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

export function CanvasBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { theme, themeHue } = useTheme()
    const mouseRef = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let width = window.innerWidth
        let height = window.innerHeight

        let resizeTimeout: any
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
                width = window.innerWidth
                height = window.innerHeight
                if (canvas) {
                    canvas.width = width
                    canvas.height = height
                }
            }, 100)
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("mousemove", handleMouseMove)

        // Initial set
        handleResize()

        // Derive colors from theme hue
        const hue = parseInt(themeHue) || 120
        const [gr, gg, gb] = hslToRgb(hue, 100, 75) // grid tint color
        const [sr, sg, sb] = hslToRgb(hue, 72, 45)   // spotlight color
        const [dr, dg, db] = hslToRgb(hue, 100, 50)   // dot color

        const gridSize = 40
        const gridColorDark = `rgba(${gr}, ${gg}, ${gb}, 0.07)`
        const gridColorLight = "rgba(0, 0, 0, 0.05)"
        const highlightRadius = 200

        const drawGrid = () => {
            const isDark = document.documentElement.classList.contains("dark")

            ctx.clearRect(0, 0, width, height)

            // Base Grid Style
            ctx.strokeStyle = isDark ? gridColorDark : gridColorLight
            ctx.lineWidth = 1

            const mx = mouseRef.current.x
            const my = mouseRef.current.y

            // Draw Vertical Lines
            for (let x = 0; x <= width; x += gridSize) {
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, height)
                ctx.stroke()
            }

            // Draw Horizontal Lines
            for (let y = 0; y <= height; y += gridSize) {
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(width, y)
                ctx.stroke()
            }

            // Draw Mouse Spotlight
            if (mx && my) {
                const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, highlightRadius);
                gradient.addColorStop(0, isDark ? `rgba(${sr}, ${sg}, ${sb}, 0.15)` : `rgba(${sr}, ${sg}, ${sb}, 0.1)`);
                gradient.addColorStop(1, "transparent");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                const snapX = Math.round(mx / gridSize) * gridSize
                const snapY = Math.round(my / gridSize) * gridSize

                ctx.fillStyle = `rgb(${dr}, ${dg}, ${db})`
                ctx.beginPath()
                ctx.arc(snapX, snapY, 3, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        let animationFrameId: number
        const animate = () => {
            drawGrid()
            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("mousemove", handleMouseMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [theme, themeHue])

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 bg-background transition-colors duration-500 pointer-events-none"
        />
    )
}

