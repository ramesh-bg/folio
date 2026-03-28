import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"

type GameState = "idle" | "playing" | "won" | "lost"
type MouseBehavior = "roaming" | "fleeing" | "hiding" | "diving"
interface Vec2 { x: number; y: number }
interface MouseObject {
  pos: Vec2; vel: Vec2; behavior: MouseBehavior; hideTimer: number;
  roamTarget: Vec2; curHide: DOMRect | null; history: Vec2[]; dots: HTMLDivElement[];
  el: HTMLDivElement | null; diveTimer: number; boostTimer: number;
}

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
  const mouseRef = useRef<HTMLDivElement>(null) // Template for clones
  const shockwaveRef = useRef<SVGSVGElement>(null)
  const particles = useRef<{ el: HTMLDivElement, vx: number, vy: number, life: number }[]>([])
  const stars = useRef<HTMLDivElement[]>([])
  const cheeseEl = useRef<HTMLDivElement | null>(null)

  // mutable game state (no re-renders)
  const gs = useRef<GameState>("idle")
  const catPos = useRef<Vec2>({ x: 200, y: 400 })
  const catVel = useRef<Vec2>({ x: 0, y: 0 })
  const mice = useRef<MouseObject[]>([])
  const miceHoles = useRef<Vec2[]>([])
  const cheesePos = useRef<Vec2 | null>(null)
  const cheeseSpawnTimer = useRef(120)

  const hideSpots = useRef<DOMRect[]>([])
  const catchCount = useRef(0)
  const timeRef = useRef(GAME_SECONDS)
  const pouncing = useRef(false)
  const pounceCD = useRef(0)
  const keys = useRef<Set<string>>(new Set())
  const timerID = useRef<ReturnType<typeof setInterval> | null>(null)
  const catH = useRef<Vec2[]>([])
  const catDots = useRef<HTMLDivElement[]>([])

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
  // ── helpers ─────────────────────────────────────────────────────────────
  const spawnText = useCallback((txt: string, x: number, y: number, color = "hsl(var(--primary))") => {
    if (!containerRef.current) return
    const d = document.createElement("div")
    d.innerText = txt
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;color:${color};font-family:monospace;font-weight:bold;` +
      `font-size:14px;pointer-events:none;z-index:50;text-shadow:0 0 10px rgba(0,0,0,0.5);`
    containerRef.current.appendChild(d)
    gsap.to(d, { y: -60, opacity: 0, duration: 1.2, onComplete: () => d.remove() })
  }, [])

  const makeMouse = useCallback((x: number, y: number): MouseObject => {
    const el = mouseRef.current?.cloneNode(true) as HTMLDivElement
    if (el && containerRef.current) {
      el.style.opacity = "1"
      containerRef.current.appendChild(el)
    }
    const dots = Array.from({ length: TRAIL_LEN_MOUSE }, (_, i) => {
      const d = document.createElement("div")
      const size = (1 - i / TRAIL_LEN_MOUSE) * 3.5
      const col = "hsl(var(--primary)/0.5)"
      d.style.cssText = `position:absolute;top:0;left:0;border-radius:50%;pointer-events:none;` +
        `width:${size}px;height:${size}px;background:${col};box-shadow:0 0 ${size * 2}px ${col};opacity:0;`
      containerRef.current?.appendChild(d)
      return d
    })
    return {
      pos: { x, y }, vel: { x: 0, y: 0 }, behavior: "roaming", hideTimer: 0,
      roamTarget: { x, y }, curHide: null, history: Array.from({ length: TRAIL_LEN_MOUSE }, () => ({ x, y })),
      dots, el, diveTimer: 0, boostTimer: 0
    }
  }, [])

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
    
    // mouse holes
    const W = window.innerWidth; const H = window.innerHeight
    miceHoles.current = [{x: 60, y: 60}, {x: W-60, y: 60}, {x: 60, y: H-60}, {x: W-60, y: H-60}]
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
    const targets = [catRef.current, ...mice.current.map(m => m.el)].filter(Boolean) as HTMLDivElement[]
    if (targets.length) gsap.to(targets, { opacity: 0, scale: 0, duration: 0.4 })
    gsap.to(':root', { '--theme-hue': 142, duration: 1 }) // reset hue
  }, [])

  const startGame = useCallback(() => {
    scanSpots()
    const W = window.innerWidth
    const H = window.innerHeight
    catPos.current = { x: 120, y: H / 2 }
    catVel.current = { x: 0, y: 0 }
    
    mice.current.forEach(m => { m.el?.remove(); m.dots.forEach(d => d.remove()) })
    mice.current = [makeMouse(W - 120, H / 2)]
    
    catchCount.current = 0
    timeRef.current = GAME_SECONDS
    pounceCD.current = 0
    pouncing.current = false
    catH.current = Array.from({ length: TRAIL_LEN_CAT }, () => ({ ...catPos.current }))
    setCatches(0)
    setTimeLeft(GAME_SECONDS)
    setPounceReady(true)
    gs.current = "playing"
    setGameState("playing")
    gsap.killTweensOf([catRef.current, ...mice.current.map(m => m.el)])
    if (catRef.current) { catRef.current.style.opacity = "0"; catRef.current.style.transform = "scale(0)"; gsap.to(catRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }) }
    if (timerID.current) clearInterval(timerID.current)
    timerID.current = setInterval(() => {
      timeRef.current -= 1
      setTimeLeft(timeRef.current)
      if (timeRef.current <= 0) { endGame("lost") }
      // theme shift
      if (timeRef.current < 20) {
        const hue = lerp(142, 0, (20 - timeRef.current) / 20)
        document.documentElement.style.setProperty('--theme-hue', String(hue))
      }
    }, 1000)
  }, [scanSpots, endGame, makeMouse])

  const resetToIdle = useCallback(() => {
    if (timerID.current) clearInterval(timerID.current)
    gs.current = "idle"
    setGameState("idle")
    setCatches(0)
    setTimeLeft(GAME_SECONDS)
    const targets = [catRef.current, cheeseEl.current, ...mice.current.map(m => m.el)].filter(Boolean) as HTMLDivElement[]
    if (targets.length) gsap.to(targets, { opacity: 0, scale: 0, duration: 0.3 })
    cheesePos.current = null
    gsap.to(':root', { '--theme-hue': 142, duration: 1 })
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
        // find nearest mouse to aim at
        let target = { x: catPos.current.x + catVel.current.x * 10, y: catPos.current.y + catVel.current.y * 10 }
        if (mice.current.length > 0) {
          const nearest = mice.current.reduce((prev, curr) => vdist(catPos.current, curr.pos) < vdist(catPos.current, prev.pos) ? curr : prev)
          target = nearest.pos
        }
        const dx = target.x - catPos.current.x
        const dy = target.y - catPos.current.y
        const d = Math.hypot(dx, dy) || 1
        // Shockwave effect
        if (shockwaveRef.current) {
          gsap.fromTo(shockwaveRef.current, 
            { scale: 0.2, opacity: 1, x: catPos.current.x, y: catPos.current.y - window.scrollY },
            { scale: 3.5, opacity: 0, duration: 0.6, ease: "power2.out" }
          )
        }
        spawnText("SPRINT!", catPos.current.x, catPos.current.y - window.scrollY - 30)
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
        mice.current.forEach(m => m.dots.forEach(d => { d.style.opacity = "0" }))
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

      // ── render cat ──
      if (catRef.current) {
        const catSpd = Math.hypot(catVel.current.x, catVel.current.y)
        const catAng = catSpd > 0.2 ? Math.atan2(catVel.current.y, catVel.current.x) * (180 / Math.PI) + 90 : 0
        const catVpX = catPos.current.x - 30
        const catVpY = catPos.current.y - sY - 30
        const catRx = clamp(-catVel.current.y * 3, -40, 40)
        const catRy = clamp(catVel.current.x * 3, -40, 40)
        const catSy = clamp(1 + catSpd * 0.04, 1, 1.45)
        const catSx = clamp(1 - catSpd * 0.015, 0.68, 1)
        catRef.current.style.left = `${catVpX}px`
        catRef.current.style.top = `${catVpY}px`
        catRef.current.style.transform = `perspective(800px) rotateX(${catRx}deg) rotateY(${catRy}deg) rotateZ(${catAng}deg) scaleX(${catSx}) scaleY(${catSy})`
      }

      // trails
      catH.current.unshift({ x: catPos.current.x, y: catPos.current.y - sY })
      catH.current.length = TRAIL_LEN_CAT
      catDots.current.forEach((d, i) => {
        const h = catH.current[i]
        if (h) { d.style.transform = `translate(${h.x - 2.5}px,${h.y - 2.5}px)`; d.style.opacity = String((1 - i / TRAIL_LEN_CAT) * 0.65) }
      })

      // ── mice engine ──
      mice.current.forEach((m) => {
        const dist = vdist(catPos.current, m.pos)
        
        // boost timer
        if (m.boostTimer > 0) {
          m.boostTimer -= dt
          if (m.boostTimer < 0) m.boostTimer = 0
        }

        const curSpdMut = m.boostTimer > 0 ? 1.6 : 1.0

        if (m.behavior === "roaming") {
          if (dist < FLEE_RADIUS) { m.behavior = "fleeing"; spawnText("Eek!", m.pos.x, m.pos.y - sY, "white") }
          const rdx = m.roamTarget.x - m.pos.x; const rdy = m.roamTarget.y - m.pos.y
          const rd = Math.hypot(rdx, rdy)
          if (rd < 30) {
            m.roamTarget = { x: PAD + Math.random() * (W - 2 * PAD), y: sY + PAD + Math.random() * (vH - 2 * PAD) }
          }
          if (rd > 0) {
            m.vel.x = lerp(m.vel.x, (rdx / rd) * MOUSE_ROAM_SPEED * dt * curSpdMut, 0.08)
            m.vel.y = lerp(m.vel.y, (rdy / rd) * MOUSE_ROAM_SPEED * dt * curSpdMut, 0.08)
          }
        } else if (m.behavior === "fleeing") {
          if (dist > FLEE_RADIUS * 1.5) {
            const eligible = hideSpots.current.filter(r => vdist({ x: r.left + r.width / 2, y: r.top + sY + r.height / 2 }, catPos.current) > 160)
            if (eligible.length > 0 && Math.random() < 0.45) {
              eligible.sort((a, b) => vdist(m.pos, {x: a.left+a.width/2, y: a.top+sY+a.height/2}) - vdist(m.pos, {x: b.left+b.width/2, y: b.top+sY+b.height/2}))
              m.curHide = eligible[0]; m.behavior = "hiding"; m.hideTimer = 0
            } else {
              m.behavior = "roaming"
              m.roamTarget = { x: PAD + Math.random() * (W - 2 * PAD), y: sY + PAD + Math.random() * (vH - 2 * PAD) }
            }
          }
          // check holes
          miceHoles.current.forEach(h => {
            if (vdist(m.pos, {x: h.x, y: h.y + sY}) < 40 && Math.random() < 0.1) {
              m.behavior = "diving"; m.diveTimer = 0; spawnText("DIVE!", m.pos.x, m.pos.y - sY, "#888")
            }
          })
          const fDx = m.pos.x - catPos.current.x; const fDy = m.pos.y - catPos.current.y
          const fD = Math.hypot(fDx, fDy) || 1
          m.vel.x = lerp(m.vel.x, (fDx / fD) * MOUSE_FLEE_SPEED * dt * curSpdMut, 0.14)
          m.vel.y = lerp(m.vel.y, (fDy / fD) * MOUSE_FLEE_SPEED * dt * curSpdMut, 0.14)
        } else if (m.behavior === "hiding") {
          if (!m.curHide) { m.behavior = "roaming" }
          else {
            const sc = { x: m.curHide.left + m.curHide.width / 2, y: m.curHide.top + sY + m.curHide.height / 2 }
            const dSpot = vdist(m.pos, sc)
            if (dSpot > 20) {
              const sx = sc.x - m.pos.x; const sy = sc.y - m.pos.y
              const sd = Math.hypot(sx, sy) || 1
              m.vel.x = lerp(m.vel.x, (sx / sd) * MOUSE_FLEE_SPEED * dt * 0.9 * curSpdMut, 0.1)
              m.vel.y = lerp(m.vel.y, (sy / sd) * MOUSE_FLEE_SPEED * dt * 0.9 * curSpdMut, 0.1)
            } else {
              m.vel.x *= 0.75; m.vel.y *= 0.75; m.hideTimer += dt
              if (m.hideTimer > 120 || vdist(sc, catPos.current) < 110) { m.curHide = null; m.behavior = "fleeing"; m.hideTimer = 0 }
            }
            if (dist < FLEE_RADIUS * 0.6) { m.curHide = null; m.behavior = "fleeing" }
          }
        } else if (m.behavior === "diving") {
          m.vel.x *= 0.8; m.vel.y *= 0.8; m.diveTimer += dt
          if (m.diveTimer > 30) {
            const nextHole = miceHoles.current[Math.floor(Math.random() * miceHoles.current.length)]
            m.pos = { x: nextHole.x, y: nextHole.y + sY }
            m.behavior = "fleeing"; m.diveTimer = 0
          }
        }

        m.pos.x += m.vel.x; m.pos.y += m.vel.y
        m.pos.x = clamp(m.pos.x, PAD, W - PAD); m.pos.y = clamp(m.pos.y, sY + PAD, sY + vH - PAD)

        // catch collision
        if (vdist(catPos.current, m.pos) < 42 && m.behavior !== "diving") {
          catchCount.current++; setCatches(catchCount.current)
          spawnExplosion(m.pos.x, m.pos.y - sY)
          spawnText("GOTCHA!", m.pos.x, m.pos.y - sY, "hsl(var(--primary))")
          if (catRef.current) { catRef.current.style.filter = "drop-shadow(0 0 25px white)"; setTimeout(() => { if (catRef.current) catRef.current.style.filter = "drop-shadow(0 0 12px hsl(var(--primary)/0.8))" }, 600) }
          // Respawn or Win
          if (catchCount.current >= MAX_CATCHES) { endGame("won") }
          else {
            const startHole = miceHoles.current[Math.floor(Math.random() * miceHoles.current.length)]
            m.pos = { x: startHole.x, y: startHole.y + sY }
            m.vel = { x: 0, y: 0 }; m.behavior = "roaming"
            if (catchCount.current === 3) mice.current.push(makeMouse(W / 2, sY + vH / 2))
          }
        }

        // cheese collision
        if (cheesePos.current && vdist(m.pos, { x: cheesePos.current.x, y: cheesePos.current.y + sY }) < 35) {
          m.boostTimer = 300; cheesePos.current = null; if (cheeseEl.current) cheeseEl.current.style.opacity = "0"
          spawnText("ZOOM!", m.pos.x, m.pos.y - sY, "#fbbf24")
        }

        // render mouse
        if (m.el) {
          const mSpd = Math.hypot(m.vel.x, m.vel.y)
          const mAng = mSpd > 0.2 ? Math.atan2(m.vel.y, m.vel.x) * (180 / Math.PI) + 90 : 0
          const isHiding = m.behavior === "hiding"
          m.el.style.left = `${m.pos.x - 18}px`; m.el.style.top = `${m.pos.y - sY - 18}px`
          m.el.style.opacity = (m.behavior === "diving" || isHiding) ? "0.2" : "1"
          m.el.style.transform = `perspective(800px) rotateZ(${mAng}deg) scale(${m.behavior === "diving" ? 0.5 : 1})`
        }

        // mouse trails
        m.history.unshift({ x: m.pos.x, y: m.pos.y - sY })
        m.history.length = TRAIL_LEN_MOUSE
        m.dots.forEach((d, i) => {
          const h = m.history[i]
          if (h) { d.style.transform = `translate(${h.x - 1.75}px,${h.y - 1.75}px)`; d.style.opacity = String((1 - i / TRAIL_LEN_MOUSE) * 0.5) }
        })
      })

      // ── cheese logic ──
      if (cheesePos.current) {
        if (vdist(catPos.current, {x: cheesePos.current.x, y: cheesePos.current.y + sY}) < 45) {
          timeRef.current += 5; setTimeLeft(timeRef.current); cheesePos.current = null;
          if (cheeseEl.current) cheeseEl.current.style.opacity = "0"
          spawnText("+5 SECONDS!", catPos.current.x, catPos.current.y - sY, "#fbbf24")
        }
      } else {
        cheeseSpawnTimer.current -= dt
        if (cheeseSpawnTimer.current <= 0) {
          cheesePos.current = { x: PAD + Math.random() * (W - 2 * PAD), y: PAD + Math.random() * (vH - 2 * PAD) }
          cheeseSpawnTimer.current = 700 + Math.random() * 400
          if (cheeseEl.current) {
            cheeseEl.current.style.left = `${cheesePos.current.x - 15}px`; cheeseEl.current.style.top = `${cheesePos.current.y - 15}px`
            cheeseEl.current.style.opacity = "1"; gsap.fromTo(cheeseEl.current, {scale: 0}, {scale: 1, duration: 0.5, ease: "back.out"})
          }
        }
      }
    })
    return () => {
      gsap.ticker.remove(ticker)
      if (timerID.current) clearInterval(timerID.current)
      catDots.current.forEach(d => d.remove())
      mice.current.forEach(m => {
        m.el?.remove()
        m.dots.forEach(d => d.remove())
      })
    }
  }, [makeDots, endGame])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <>
      {/* ── game layer ── */}
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[5] overflow-hidden hidden md:block" aria-hidden="true">
        {/* Mouse Holes (High-Fidelity Recessed Design) */}
        {gameState !== "idle" && miceHoles.current.map((h, i) => (
          <div key={i} className="absolute w-[80px] h-[45px] rounded-[50%] pointer-events-none"
            style={{ 
              left: h.x-40, top: h.y-22, 
              background: "#050505",
              boxShadow: `
                inset 0 10px 20px rgba(0,0,0,0.9), 
                inset 0 -4px 10px rgba(0,0,0,0.8),
                inset 0 1px 1px rgba(255,255,255,0.05),
                0 2px 3px rgba(255,255,255,0.08)
              `,
              border: "1px solid #111",
              borderTop: "3px solid #000",
              transform: "perspective(500px) rotateX(8deg)"
            }}>
             <div className="absolute inset-0 opacity-10" 
               style={{ background: "radial-gradient(circle at 50% 30%, hsl(var(--primary)) 0%, transparent 80%)" }} />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] bg-black/60 rounded-full blur-[1px]" />
          </div>
        ))}
        {/* Cheese */}
        <div ref={cheeseEl} className="absolute w-[30px] h-[30px] opacity-0 z-10" style={{ left: 0, top: 0 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
            <path d="M10 80 L90 80 L50 20 Z" fill="currentColor" />
            <circle cx="40" cy="55" r="5" fill="black" opacity="0.2" />
            <circle cx="60" cy="65" r="4" fill="black" opacity="0.2" />
            <circle cx="50" cy="45" r="3" fill="black" opacity="0.2" />
          </svg>
        </div>
        {/* Shockwave */}
        <svg ref={shockwaveRef} className="absolute pointer-events-none opacity-0 z-20" width="100" height="100" style={{ transform: "translate(-50%, -50%)" }}>
           <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
        </svg>
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
