import { useEffect, useRef } from 'react'

const NODE_COUNT = 80
const CONNECT_DIST = 150
const CURSOR_DIST = 120
const NODE_R = 2
const NODE_R_HOVER = 5
const AURA_R = 12

function randVel() {
  return (Math.random() - 0.5) * 0.6
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

export default function HeroMeshCanvas() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })
  const stateRef = useRef({ nodes: [], w: 0, h: 0, raf: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = stateRef.current

    const initNodes = (w, h) =>
      Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: randVel(),
        vy: randVel(),
      }))

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = rect.width
      const h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state.w = w
      state.h = h
      if (state.nodes.length === 0) {
        state.nodes = initNodes(w, h)
      }
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      }
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, active: false }
    }

    const section = wrap.closest('section')
    section?.addEventListener('mousemove', onMouseMove)
    section?.addEventListener('mouseleave', onMouseLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    window.addEventListener('resize', resize)
    resize()

    const tick = () => {
      const { nodes, w, h } = state
      const mouse = mouseRef.current
      if (!w || !h) {
        state.raf = requestAnimationFrame(tick)
        return
      }

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x <= 0) {
          n.x = 0
          n.vx *= -1
        } else if (n.x >= w) {
          n.x = w
          n.vx *= -1
        }
        if (n.y <= 0) {
          n.y = 0
          n.vy *= -1
        } else if (n.y >= h) {
          n.y = h
          n.vy *= -1
        }
      }

      ctx.clearRect(0, 0, w, h)

      const nearCursor = new Array(nodes.length).fill(false)
      if (mouse.active) {
        for (let i = 0; i < nodes.length; i++) {
          if (dist(nodes[i].x, nodes[i].y, mouse.x, mouse.y) < CURSOR_DIST) {
            nearCursor[i] = true
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
          if (d >= CONNECT_DIST) continue

          const fade = 1 - d / CONNECT_DIST
          const bright = nearCursor[i] || nearCursor[j]

          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          if (bright) {
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)'
            ctx.lineWidth = 1
          } else {
            ctx.strokeStyle = `rgba(196, 181, 253, ${0.25 * fade})`
            ctx.lineWidth = 0.5
          }
          ctx.stroke()
        }
      }

      if (mouse.active) {
        for (let i = 0; i < nodes.length; i++) {
          const d = dist(nodes[i].x, nodes[i].y, mouse.x, mouse.y)
          if (d >= CURSOR_DIST) continue
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (nearCursor[i]) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, AURA_R, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(196, 181, 253, 0.2)'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(n.x, n.y, NODE_R_HOVER, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(139, 92, 246, 0.85)'
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(167, 139, 250, 0.4)'
          ctx.fill()
        }
      }

      state.raf = requestAnimationFrame(tick)
    }

    state.raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(state.raf)
      section?.removeEventListener('mousemove', onMouseMove)
      section?.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className="absolute inset-0 z-0" aria-hidden>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
