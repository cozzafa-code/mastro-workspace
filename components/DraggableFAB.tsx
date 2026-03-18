// components/DraggableFAB.tsx
'use client'
import { useRef, useState, useEffect, FC } from 'react'

interface Props {
  fabOpen: boolean
  setFabOpen: (v: boolean) => void
  acc: string
  children?: React.ReactNode
}

const W = 58
const H = 58
const PAD = 16

const DraggableFAB: FC<Props> = ({ fabOpen, setFabOpen, acc, children }) => {
  const [pos, setPos] = useState({ x: -1, y: -1 })
  const [dragging, setDragging] = useState(false)
  const dragged = useRef(false)
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    if (pos.x === -1) {
      setPos({
        x: window.innerWidth - W - PAD,
        y: window.innerHeight - H - 80,
      })
    }
  }, [])

  const clamp = (x: number, y: number) => ({
    x: Math.max(PAD, Math.min(window.innerWidth - W - PAD, x)),
    y: Math.max(PAD, Math.min(window.innerHeight - H - 70, y)),
  })

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    dragged.current = false
    origin.current = { x: t.clientX, y: t.clientY, px: pos.x, py: pos.y }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const dx = t.clientX - origin.current.x
    const dy = t.clientY - origin.current.y
    if (Math.hypot(dx, dy) > 5) {
      dragged.current = true
      setDragging(true)
      if (fabOpen) setFabOpen(false)
      setPos(clamp(origin.current.px + dx, origin.current.py + dy))
    }
  }

  const onTouchEnd = () => {
    setDragging(false)
    if (!dragged.current) setFabOpen(!fabOpen)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragged.current = false
    origin.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - origin.current.x
      const dy = ev.clientY - origin.current.y
      if (Math.hypot(dx, dy) > 5) {
        dragged.current = true
        setDragging(true)
        if (fabOpen) setFabOpen(false)
        setPos(clamp(origin.current.px + dx, origin.current.py + dy))
      }
    }
    const onUp = () => {
      setDragging(false)
      if (!dragged.current) setFabOpen(!fabOpen)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (pos.x === -1) return null

  const menuAbove = pos.y > window.innerHeight * 0.55

  return (
    <>
      {fabOpen && (
        <div onClick={() => setFabOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />
      )}

      <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 90, touchAction: 'none', userSelect: 'none' }}>

        {fabOpen && (
          <div style={{
            position: 'absolute',
            [menuAbove ? 'bottom' : 'top']: H + 12,
            right: 0,
            width: 260,
            background: '#0B1F2A',
            borderRadius: 16,
            padding: 10,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            animation: 'fabIn 0.18s ease',
          }}>
            <style>{`@keyframes fabIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
            {children}
          </div>
        )}

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            width: W, height: H,
            borderRadius: 18,
            background: fabOpen
              ? 'linear-gradient(135deg, #0B1F2A, #1a3a4a)'
              : `linear-gradient(135deg, ${acc}, ${acc}cc)`,
            boxShadow: dragging ? `0 16px 40px ${acc}70` : fabOpen ? '0 4px 20px rgba(0,0,0,0.5)' : `0 6px 20px ${acc}60`,
            cursor: dragging ? 'grabbing' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            transition: dragging ? 'none' : 'all 0.2s ease',
            transform: dragging ? 'scale(1.08)' : fabOpen ? 'scale(0.96)' : 'scale(1)',
          }}
        >
          {fabOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <>
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
                <path d="M1 13L6 1l5 8 5-8 5 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 2.5, fontFamily: 'system-ui,sans-serif' }}>OS</span>
            </>
          )}
        </div>

        {!fabOpen && !dragging && (
          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />)}
          </div>
        )}
      </div>
    </>
  )
}

export default DraggableFAB
