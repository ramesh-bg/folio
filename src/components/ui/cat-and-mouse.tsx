import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"

type GameState = "idle" | "playing" | "won" | "lost"
type MouseBehavior = "roaming" | "fleeing" | "hiding"
interface Vec2 { x: number; y: number }

const MAX_CATCHES = 5
const GAME_SECONDS = 90
const CAT_ACCEL = 0.75
const CAT_FRICTION = 0.87
const CAT_MAX_SPEED = 7
const POUNCE_SPEED = 18
const POUNCE_CD = 3       // seconds
const MOUSE_ROAM_SPEED = 1.8
const MOUSE_FLEE_SPEED = 4.2
const FLEE_RADIUS = 190
const TRAIL_LEN_CAT = 20
const TRAIL_LEN_MOUSE = 14

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function vdist(a: Vec2, b: Vec2) { return Math.hypot(a.x - b.x, a.y - b.y) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function CatAndMouseGame() {
  const [gameState, setGameState] = useState<GameState>("idle")
  const [catches, setCatches] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [pounceReady, setPounceReady] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<HTMLDivElement>(null)
  const particles = useRef<{ el: HTMLDivElement, vx: number, vy: number, life: number }[]>([])
  const stars = useRef<HTMLDivElement[]>([])

  // mutable game state (no re-renders)
  const gs = useRef<GameState>("idle")
  const catPos = useRef<Vec2>({ x: 200, y: 400 })
  const catVel = useRef<Vec2>({ x: 0, y: 0 })
  const mPos = useRef<Vec2>({ x: 800, y: 400 })
  const mVel = useRef<Vec2>({ x: 0, y: 0 })
  const mBehavior = useRef<MouseBehavior>("roaming")
  const mHideTimer = useRef(0)
  const roamTarget = useRef<Vec2>({ x: 600, y: 300 })
  const hideSpots = useRef<DOMRect[]>([])
  const curHide = useRef<DOMRect | null>(null)
  const catchCount = useRef(0)
  const timeRef = useRef(GAME_SECONDS)
  const pouncing = useRef(false)
  const pounceCD = useRef(0)
  const keys = useRef<Set<string>>(new Set())
  const timerID = useRef<ReturnType<typeof setInterval> | null>(null)
  const catH = useRef<Vec2[]>([])
  const mH = useRef<Vec2[]>([])
  const catDots = useRef<HTMLDivElement[]>([])
  const mouseDots = useRef<HTMLDivElement[]>([])

  // ── scan DOM for hide spots ──────────────────────────────────────────────
  const scanSpots = useCallback(() => {
    const els = document.querySelectorAll("section, [class*='card'], article, aside, nav")
    const spots: DOMRect[] = []
    els.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.width > 120 && r.height > 80) spots.push(r)
    })
    hideSpots.current = spots
  }, [])

  // ── dot factory ─────────────────────────────────────────────────────────
  const makeDots = useCallback(() => {
    if (!containerRef.current) return
    const c = containerRef.current
    const make = (col: string, size: number): HTMLDivElement => {
      const d = document.createElement("div")
      d.style.cssText = `position:absolute;top:0;left:0;border-radius:50%;pointer-events:none;` +
        `width:${size}px;height:${size}px;background:${col};box-shadow:0 0 ${size * 2}px ${col};opacity:0;`
      c.appendChild(d)
      return d
    }
    catDots.current = Array.from({ length: TRAIL_LEN_CAT }, (_, i) => make("hsl(var(--primary))", (1 - i / TRAIL_LEN_CAT) * 5))
    mouseDots.current = Array.from({ length: TRAIL_LEN_MOUSE }, (_, i) => make("hsl(var(--primary)/0.5)", (1 - i / TRAIL_LEN_MOUSE) * 3.5))

    // ambient stars
    stars.current = Array.from({ length: 40 }, () => {
      const d = document.createElement("div")
      const size = Math.random() * 2 + 1
      d.style.cssText = `position:absolute;background:white;border-radius:50%;pointer-events:none;` +
        `width:${size}px;height:${size}px;opacity:${Math.random() * 0.5 + 0.2};` +
        `left:${Math.random() * 100}%;top:${Math.random() * 100}%;box-shadow:0 0 4px white;`
      c.appendChild(d)
      return d
    })
  }, [])

  const spawnExplosion = useCallback((x: number, y: number) => {
    if (!containerRef.current) return
    for (let i = 0; i < 20; i++) {
      const d = document.createElement("div")
      const size = Math.random() * 4 + 2
      const hue = Math.random() > 0.5 ? "var(--primary)" : "60" // yellow/primary mix
      d.style.cssText = `position:absolute;background:hsl(${hue});border-radius:50%;pointer-events:none;z-index:10;` +
        `width:${size}px;height:${size}px;left:${x}px;top:${y}px;box-shadow:0 0 10px hsl(${hue});`
      containerRef.current.appendChild(d)
      const ang = Math.random() * Math.PI * 2
      const mag = Math.random() * 6 + 2
      particles.current.push({
        el: d,
        vx: Math.cos(ang) * mag,
        vy: Math.sin(ang) * mag,
        life: 1.0
      })
    }
  }, [])

  // ── start / end ──────────────────────────────────────────────────────────
  const endGame = useCallback((result: "won" | "lost") => {
    if (gs.current !== "playing") return
    gs.current = result
    setGameState(result)
    if (timerID.current) clearInterval(timerID.current)
    const targets = [catRef.current, mouseRef.current].filter(Boolean)
    if (targets.length) gsap.to(targets, { opacity: 0, scale: 0, duration: 0.4 })
  }, [])

  const startGame = useCallback(() => {
    scanSpots()
    const W = window.innerWidth
    const H = window.innerHeight
    catPos.current = { x: 120, y: H / 2 }
    catVel.current = { x: 0, y: 0 }
    mPos.current = { x: W - 120, y: H / 2 }
    mVel.current = { x: 0, y: 0 }
    mBehavior.current = "roaming"
    roamTarget.current = { x: W / 2, y: H / 2 }
    catchCount.current = 0
    timeRef.current = GAME_SECONDS
    pounceCD.current = 0
    pouncing.current = false
    curHide.current = null
    catH.current = Array.from({ length: TRAIL_LEN_CAT }, () => ({ ...catPos.current }))
    mH.current = Array.from({ length: TRAIL_LEN_MOUSE }, () => ({ ...mPos.current }))
    setCatches(0)
    setTimeLeft(GAME_SECONDS)
    setPounceReady(true)
    gs.current = "playing"
    setGameState("playing")
    gsap.killTweensOf([catRef.current, mouseRef.current])
    if (catRef.current) { catRef.current.style.opacity = "0"; catRef.current.style.transform = "scale(0)"; gsap.to(catRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }) }
    if (mouseRef.current) { mouseRef.current.style.opacity = "0"; mouseRef.current.style.transform = "scale(0)"; gsap.to(mouseRef.current, { opacity: 1, scale: 1, duration: 0.5, delay: 0.1, ease: "back.out(2)" }) }
    if (timerID.current) clearInterval(timerID.current)
    timerID.current = setInterval(() => {
      timeRef.current -= 1
      setTimeLeft(timeRef.current)
      if (timeRef.current <= 0) { endGame("lost") }
    }, 1000)
  }, [scanSpots, endGame])

  const resetToIdle = useCallback(() => {
    if (timerID.current) clearInterval(timerID.current)
    gs.current = "idle"
    setGameState("idle")
    setCatches(0)
    setTimeLeft(GAME_SECONDS)
    const targets = [catRef.current, mouseRef.current].filter(Boolean)
    if (targets.length) gsap.to(targets, { opacity: 0, scale: 0, duration: 0.3 })
  }, [])

  // ── keys ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase())
      if (gs.current === "playing" && [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === " " && gs.current === "playing" && !pouncing.current && pounceCD.current <= 0) {
        pouncing.current = true
        const dx = mPos.current.x - catPos.current.x
        const dy = mPos.current.y - catPos.current.y
        const d = Math.hypot(dx, dy) || 1
        catVel.current = { x: (dx / d) * POUNCE_SPEED, y: (dy / d) * POUNCE_SPEED }
        pounceCD.current = POUNCE_CD * 60
        setPounceReady(false)
        setTimeout(() => { pouncing.current = false }, 350)
      }
      if (e.key === "Enter" && (gs.current === "won" || gs.current === "lost")) {
        startGame()
      }
      if (e.key === "Escape" && gs.current === "playing") {
        resetToIdle()
      }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    window.addEventListener("keydown", dn)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up) }
  }, [])

  // ── main ticker ───────────────────────────────────────────────────────────
  useEffect(() => {
    makeDots()
    const ticker = gsap.ticker.add(() => {
      if (gs.current !== "playing") {
        catDots.current.forEach(d => { d.style.opacity = "0" })
        mouseDots.current.forEach(d => { d.style.opacity = "0" })
        return
      }
      const dt = Math.min(gsap.ticker.deltaRatio(), 3)
      const W = window.innerWidth
      const sY = window.scrollY
      const vH = window.innerHeight
      const PAD = 28

      // ── pounce cooldown ──
      if (pounceCD.current > 0) {
        pounceCD.current -= dt
        if (pounceCD.current <= 0) { pounceCD.current = 0; setPounceReady(true) }
      }

      // ── cat (player) ──
      const k = keys.current
      if (!pouncing.current) {
        if (k.has("arrowleft") || k.has("a")) catVel.current.x -= CAT_ACCEL * dt
        if (k.has("arrowright") || k.has("d")) catVel.current.x += CAT_ACCEL * dt
        if (k.has("arrowup") || k.has("w")) catVel.current.y -= CAT_ACCEL * dt
        if (k.has("arrowdown") || k.has("s")) catVel.current.y += CAT_ACCEL * dt
        const spd = Math.hypot(catVel.current.x, catVel.current.y)
        if (spd > CAT_MAX_SPEED) {
          catVel.current.x = (catVel.current.x / spd) * CAT_MAX_SPEED
          catVel.current.y = (catVel.current.y / spd) * CAT_MAX_SPEED
        }
      }
      catVel.current.x *= CAT_FRICTION
      catVel.current.y *= CAT_FRICTION
      catPos.current.x += catVel.current.x * dt
      catPos.current.y += catVel.current.y * dt
      catPos.current.x = clamp(catPos.current.x, PAD, W - PAD)
      catPos.current.y = clamp(catPos.current.y, sY + PAD, sY + vH - PAD)

      // ── mouse AI ──
      const dist = vdist(catPos.current, mPos.current)

      if (mBehavior.current === "roaming") {
        if (dist < FLEE_RADIUS) { mBehavior.current = "fleeing" }
        const rdx = roamTarget.current.x - mPos.current.x
        const rdy = roamTarget.current.y - mPos.current.y
        const rd = Math.hypot(rdx, rdy)
        if (rd < 30) {
          roamTarget.current = { x: PAD + Math.random() * (W - 2 * PAD), y: sY + PAD + Math.random() * (vH - 2 * PAD) }
        }
        if (rd > 0) {
          mVel.current.x = lerp(mVel.current.x, (rdx / rd) * MOUSE_ROAM_SPEED * dt, 0.08)
          mVel.current.y = lerp(mVel.current.y, (rdy / rd) * MOUSE_ROAM_SPEED * dt, 0.08)
        }
      } else if (mBehavior.current === "fleeing") {
        if (dist > FLEE_RADIUS * 1.5) {
          // decide to hide or roam
          const eligible = hideSpots.current.filter(r => {
            const cx = r.left + r.width / 2
            const cy = r.top + sY + r.height / 2
            return vdist({ x: cx, y: cy }, catPos.current) > 160
          })
          if (eligible.length > 0 && Math.random() < 0.45) {
            // pick nearest eligible spot
            eligible.sort((a, b) => {
              const ac = { x: a.left + a.width / 2, y: a.top + sY + a.height / 2 }
              const bc = { x: b.left + b.width / 2, y: b.top + sY + b.height / 2 }
              return vdist(mPos.current, ac) - vdist(mPos.current, bc)
            })
            curHide.current = eligible[0]
            mBehavior.current = "hiding"
            mHideTimer.current = 0
          } else {
            mBehavior.current = "roaming"
            roamTarget.current = { x: PAD + Math.random() * (W - 2 * PAD), y: sY + PAD + Math.random() * (vH - 2 * PAD) }
          }
        }
        const fDx = mPos.current.x - catPos.current.x
        const fDy = mPos.current.y - catPos.current.y
        const fD = Math.hypot(fDx, fDy) || 1
        mVel.current.x = lerp(mVel.current.x, (fDx / fD) * MOUSE_FLEE_SPEED * dt, 0.14)
        mVel.current.y = lerp(mVel.current.y, (fDy / fD) * MOUSE_FLEE_SPEED * dt, 0.14)
      } else if (mBehavior.current === "hiding") {
        const spot = curHide.current
        if (!spot) { mBehavior.current = "roaming" }
        else {
          const sc = { x: spot.left + spot.width / 2, y: spot.top + sY + spot.height / 2 }
          const dSpot = vdist(mPos.current, sc)
          if (dSpot > 20) {
            const sx = sc.x - mPos.current.x; const sy = sc.y - mPos.current.y
            const sd = Math.hypot(sx, sy) || 1
            mVel.current.x = lerp(mVel.current.x, (sx / sd) * MOUSE_FLEE_SPEED * dt * 0.9, 0.1)
            mVel.current.y = lerp(mVel.current.y, (sy / sd) * MOUSE_FLEE_SPEED * dt * 0.9, 0.1)
          } else {
            mVel.current.x *= 0.75; mVel.current.y *= 0.75
            mHideTimer.current += dt
            if (mHideTimer.current > 120 || vdist(sc, catPos.current) < 110) {
              curHide.current = null; mBehavior.current = "fleeing"; mHideTimer.current = 0
            }
          }
          if (dist < FLEE_RADIUS * 0.6) { curHide.current = null; mBehavior.current = "fleeing" }
        }
      }

      mPos.current.x += mVel.current.x
      mPos.current.y += mVel.current.y
      mPos.current.x = clamp(mPos.current.x, PAD, W - PAD)
      mPos.current.y = clamp(mPos.current.y, sY + PAD, sY + vH - PAD)

      // ── catch ──
      const finalDist = vdist(catPos.current, mPos.current)
      if (finalDist < 42) {
        catchCount.current++
        setCatches(catchCount.current)
        spawnExplosion(mPos.current.x, mPos.current.y - sY)
        const bx = mPos.current.x - catPos.current.x; const by = mPos.current.y - catPos.current.y
        const bd = Math.hypot(bx, by) || 1
        mVel.current = { x: (bx / bd) * 9, y: (by / bd) * 9 }
        mBehavior.current = "fleeing"
        catVel.current.x *= 0.3; catVel.current.y *= 0.3
        if (catRef.current) {
          catRef.current.style.filter = "drop-shadow(0 0 25px white)"
          setTimeout(() => { if (catRef.current) catRef.current.style.filter = "drop-shadow(0 0 12px hsl(var(--primary)/0.8))" }, 600)
        }
        if (catchCount.current >= MAX_CATCHES) endGame("won")
      }

      // ── render cat ──
      const catSpd = Math.hypot(catVel.current.x, catVel.current.y)
      const mSpd = Math.hypot(mVel.current.x, mVel.current.y)
      const catAng = catSpd > 0.2 ? Math.atan2(catVel.current.y, catVel.current.x) * (180 / Math.PI) + 90 : null
      const mAng = mSpd > 0.2 ? Math.atan2(mVel.current.y, mVel.current.x) * (180 / Math.PI) + 90 : null

      if (catRef.current) {
        const catVpX = catPos.current.x - 30
        const catVpY = catPos.current.y - sY - 30
        const catRz = catAng ?? 0
        const catRx = clamp(-catVel.current.y * 3, -40, 40)
        const catRy = clamp(catVel.current.x * 3, -40, 40)
        const catSy = clamp(1 + catSpd * 0.04, 1, 1.45)
        const catSx = clamp(1 - catSpd * 0.015, 0.68, 1)
        catRef.current.style.left = `${catVpX}px`
        catRef.current.style.top = `${catVpY}px`
        catRef.current.style.transform = `perspective(800px) rotateX(${catRx}deg) rotateY(${catRy}deg) rotateZ(${catRz}deg) scaleX(${catSx}) scaleY(${catSy})`
      }

      const isHiding = mBehavior.current === "hiding" && curHide.current !== null &&
        vdist(mPos.current, { x: curHide.current.left + curHide.current.width / 2, y: curHide.current.top + sY + curHide.current.height / 2 }) < 60

      if (mouseRef.current) {
        const mVpX = mPos.current.x - 18
        const mVpY = mPos.current.y - sY - 18
        const mRz = mAng ?? 0
        const mRx = clamp(-mVel.current.y * 4, -45, 45)
        const mRy = clamp(mVel.current.x * 4, -45, 45)
        const mSy = clamp(1 + mSpd * 0.05, 1, 1.55)
        const mSx = clamp(1 - mSpd * 0.02, 0.68, 1)
        mouseRef.current.style.left = `${mVpX}px`
        mouseRef.current.style.top = `${mVpY}px`
        mouseRef.current.style.opacity = isHiding ? "0.28" : "1"
        mouseRef.current.style.filter = isHiding ? "drop-shadow(0 0 3px hsl(var(--primary)/0.2))" : "drop-shadow(0 0 8px hsl(var(--primary)/0.5))"
        mouseRef.current.style.transform = `perspective(800px) rotateX(${mRx}deg) rotateY(${mRy}deg) rotateZ(${mRz}deg) scaleX(${mSx}) scaleY(${mSy})`
      }

      // update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.life -= 0.03 * dt
        if (p.life <= 0) {
          p.el.remove()
          particles.current.splice(i, 1)
          continue
        }
        const curX = parseFloat(p.el.style.left)
        const curY = parseFloat(p.el.style.top)
        p.el.style.left = `${curX + p.vx * dt}px`
        p.el.style.top = `${curY + p.vy * dt}px`
        p.el.style.opacity = String(p.life)
        p.el.style.transform = `scale(${p.life})`
      }

      // drift stars
      stars.current.forEach((s) => {
        const curTop = parseFloat(s.style.top) || 0
        s.style.top = `${(curTop + 0.02 * dt) % 100}%`
      })

      // trails
      catH.current.unshift({ x: catPos.current.x, y: catPos.current.y - sY })
      catH.current.length = TRAIL_LEN_CAT
      mH.current.unshift({ x: mPos.current.x, y: mPos.current.y - sY })
      mH.current.length = TRAIL_LEN_MOUSE

      catDots.current.forEach((d, i) => {
        const h = catH.current[i]
        if (h) { d.style.transform = `translate(${h.x - 2.5}px,${h.y - 2.5}px)`; d.style.opacity = String((1 - i / TRAIL_LEN_CAT) * 0.65) }
      })
      mouseDots.current.forEach((d, i) => {
        const h = mH.current[i]
        if (h) { d.style.transform = `translate(${h.x - 1.75}px,${h.y - 1.75}px)`; d.style.opacity = isHiding ? "0" : String((1 - i / TRAIL_LEN_MOUSE) * 0.5) }
      })
    })
    return () => {
      gsap.ticker.remove(ticker)
      if (timerID.current) clearInterval(timerID.current)
      catDots.current.forEach(d => d.remove())
      mouseDots.current.forEach(d => d.remove())
    }
  }, [makeDots, endGame])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <>
      {/* ── game layer ── */}
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[5] overflow-hidden hidden md:block" aria-hidden="true">
        {/* Cat Player SVG */}
        <div ref={catRef} className="absolute w-[60px] h-[60px]" style={{ opacity: 0, filter: "drop-shadow(0 0 12px hsl(var(--primary)/0.8))", top: 0, left: 0 }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ transformOrigin: "center" }}>
            <defs>
              <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" /></linearGradient>
              <filter id="cgl"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            {/* Ears */}
            <path d="M28 32 L18 8 L45 25 M72 32 L82 8 L55 25" stroke="hsl(var(--primary))" strokeWidth="3" fill="hsl(var(--primary)/0.2)" strokeLinejoin="round" />
            {/* Head */}
            <path d="M20 50 Q20 22 50 22 Q80 22 80 50 Q80 82 50 82 Q20 82 20 50" fill="url(#cg)" stroke="hsl(var(--primary))" strokeWidth="3" filter="url(#cgl)" />
            {/* Eyes */}
            <ellipse cx="36" cy="46" rx="5" ry="7" fill="hsl(var(--primary))" className="animate-pulse" />
            <ellipse cx="64" cy="46" rx="5" ry="7" fill="hsl(var(--primary))" className="animate-pulse" />
            <circle cx="36" cy="44" r="1.5" fill="white" opacity="0.8" />
            <circle cx="64" cy="44" r="1.5" fill="white" opacity="0.8" />
            {/* Nose & Mouth */}
            <path d="M48 58 L52 58 L50 62 Z" fill="hsl(var(--primary))" />
            <path d="M43 68 Q50 75 57 68" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
            {/* Whiskers */}
            <path d="M22 55 L2 50 M22 62 L2 65 M78 55 L98 50 M78 62 L98 65" stroke="hsl(var(--primary)/0.6)" strokeWidth="1.5" />
          </svg>
        </div>
        {/* Mouse Target SVG */}
        <div ref={mouseRef} className="absolute w-[36px] h-[36px]" style={{ opacity: 0, filter: "drop-shadow(0 0 8px hsl(var(--primary)/0.5))", top: 0, left: 0 }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ transformOrigin: "center" }}>
            {/* Mouse Body */}
            <ellipse cx="50" cy="60" rx="25" ry="18" fill="hsl(var(--primary)/0.1)" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            {/* Mouse Ears */}
            <circle cx="35" cy="40" r="10" fill="hsl(var(--primary)/0.05)" stroke="hsl(var(--primary))" strokeWidth="2" />
            <circle cx="65" cy="40" r="10" fill="hsl(var(--primary)/0.05)" stroke="hsl(var(--primary))" strokeWidth="2" />
            {/* Tail */}
            <path d="M50 78 Q50 95 75 90" stroke="hsl(var(--primary)/0.8)" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            {/* Eyes */}
            <circle cx="42" cy="58" r="2" fill="hsl(var(--primary))" />
            <circle cx="58" cy="58" r="2" fill="hsl(var(--primary))" />
          </svg>
        </div>
      </div>

      {/* ── HUD ── */}
      {gameState === "playing" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[50] pointer-events-none hidden md:flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4 px-5 py-2.5 font-mono text-xs border backdrop-blur-xl rounded-full"
            style={{ background: "hsl(var(--primary)/0.08)", borderColor: "hsl(var(--primary)/0.4)", color: "hsl(var(--primary))" }}>
            <span>🐈 <strong>{catches}</strong>/{MAX_CATCHES} MICE CAUGHT</span>
            <span className="w-px h-3 opacity-30 bg-current" />
            <span className={`font-bold tabular-nums ${timeLeft <= 15 ? "text-red-400 animate-pulse" : ""}`}>⏱ {fmt(timeLeft)}</span>
            <span className="w-px h-3 opacity-30 bg-current" />
            <span className={pounceReady ? "text-white" : "opacity-40"}>⚡ {pounceReady ? "POUNCE [space]" : `resting ${(pounceCD.current / 60).toFixed(1)}s`}</span>
          </div>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
            WASD to chase · catch the elusive mouse · mice utilize hidden tunnels!
          </p>
          <button
            onClick={resetToIdle}
            className="mt-2 pointer-events-auto px-3 py-1 font-mono text-[10px] border transition-colors hover:bg-red-500/20"
            style={{ borderColor: "hsl(var(--primary)/0.3)", color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.05)" }}
          >
            EXIT GAME [ESC]
          </button>
        </div>
      )}

      {/* ── LAUNCH BUTTON ── */}
      {gameState === "idle" && (
        <button onClick={startGame}
          className="fixed bottom-20 left-6 z-[100] hidden md:flex items-center gap-3 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest border transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
          style={{ background: "hsl(var(--primary)/0.08)", borderColor: "hsl(var(--primary)/0.5)", color: "hsl(var(--primary))", boxShadow: "0 0 18px hsl(var(--primary)/0.15)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px hsl(var(--primary)/0.4)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px hsl(var(--primary)/0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary)/0.5)" }}
        >
          <div className="w-6 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ color: "currentColor" }}>
              <path d="M28 32 L18 8 L45 25 M72 32 L82 8 L55 25" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
              <path d="M20 50 Q20 22 50 22 Q80 22 80 50 Q80 82 50 82 Q20 82 20 50" stroke="currentColor" strokeWidth="5" />
              <ellipse cx="36" cy="46" rx="5" ry="7" fill="currentColor" />
              <ellipse cx="64" cy="46" rx="5" ry="7" fill="currentColor" />
            </svg>
          </div>
          <span className="relative z-10 px-1">START CHASE</span>
          <div className="w-6 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ color: "currentColor" }}>
              <ellipse cx="50" cy="60" rx="30" ry="22" stroke="currentColor" strokeWidth="5" />
              <circle cx="35" cy="40" r="12" stroke="currentColor" strokeWidth="4" />
              <circle cx="65" cy="40" r="12" stroke="currentColor" strokeWidth="4" />
              <path d="M50 82 Q50 95 75 90" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </div>
          <span className="w-1.5 h-3 bg-current animate-pulse ml-1 opacity-60" />
        </button>
      )}

      {/* ── RESULT SCREENS ── */}
      {(gameState === "won" || gameState === "lost") && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-5 px-12 py-10 border backdrop-blur-2xl"
            style={{ background: "hsl(var(--primary)/0.07)", borderColor: "hsl(var(--primary)/0.5)", boxShadow: "0 0 80px hsl(var(--primary)/0.25)" }}>
            <div className="text-6xl">{gameState === "won" ? "🏆" : "🐭"}</div>
            <div className="font-mono font-bold text-3xl tracking-widest" style={{ color: gameState === "won" ? "hsl(var(--primary))" : "#f87171" }}>
              {gameState === "won" ? "CAT'S FEAST!" : "MOUSE ESCAPED!"}
            </div>
            <p className="font-mono text-sm opacity-60" style={{ color: "hsl(var(--primary))" }}>
              {gameState === "won" ? `All mice have been triumphantly caught.` : `The mouse outsmarted you. Caught ${catches}/${MAX_CATCHES}.`}
            </p>
            <div className="flex gap-3 mt-2">
              <button onClick={startGame}
                className="px-6 py-2.5 font-mono text-sm font-bold uppercase tracking-widest border transition-all duration-200 hover:scale-105"
                style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.1)" }}>
                Play Again
              </button>
              <button onClick={resetToIdle}
                className="px-6 py-2.5 font-mono text-sm uppercase tracking-widest border transition-all duration-200 hover:scale-105 opacity-60 hover:opacity-100"
                style={{ borderColor: "hsl(var(--primary)/0.4)", color: "hsl(var(--primary))" }}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
