import { useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"

export function CanvasBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { theme } = useTheme()
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

        // Grid Configuration
        const gridSize = 40
        const gridColorDark = "rgba(0, 255, 128, 0.07)" // Cyber/Matrix Greenish tint
        const gridColorLight = "rgba(0, 0, 0, 0.05)" // Engineering Grey
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
                gradient.addColorStop(0, isDark ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.1)");
                gradient.addColorStop(1, "transparent");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                const snapX = Math.round(mx / gridSize) * gridSize
                const snapY = Math.round(my / gridSize) * gridSize

                ctx.fillStyle = isDark ? "#22c55e" : "#3b82f6"
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
    }, [theme])

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 bg-background transition-colors duration-500 pointer-events-none"
        />
    )
}
