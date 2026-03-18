// components/DraggableFAB.tsx
'use client'
import { useRef, useState, useEffect, useCallback, FC } from 'react'

interface Props {
  fabOpen: boolean
  setFabOpen: (v: boolean) => void
  acc: string
  onVoice?: () => void
  children?: React.ReactNode  // menu content quando aperto
}

const BUTTON_W = 56
const BUTTON_H = 56
const EDGE_PAD = 12

const DraggableFAB: FC<Props> = ({ fabOpen, setFabOpen, acc, onVoice, children }) => {
  // Posizione iniziale: angolo in basso a destra
  const [pos, setPos] = useState({ x: -1, y: -1 }) // -1 = non inizializzato
  const [dragging, setDragging] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false })
  const fabRef = useRef<HTMLDivElement>(null)

  // Inizializza posizione dopo mount (safe per SSR)
  useEffect(() => {
    if (pos.x === -1) {
      setPos({
        x: window.innerWidth - BUTTON_W - EDGE_PAD,
        y: window.innerHeight - BUTTON_H - EDGE_PAD - 70, // sopra bottom nav
      })
    }
  }, [pos.x])

  // Anima menu
  useEffect(() => {
    if (fabOpen) setMenuVisible(true)
    else {
      const t = setTimeout(() => setMenuVisible(false), 200)
      return () => clearTimeout(t)
    }
  }, [fabOpen])

  // Clamp posizione dentro schermo
  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(EDGE_PAD, Math.min(window.innerWidth - BUTTON_W - EDGE_PAD, x)),
    y: Math.max(EDGE_PAD, Math.min(window.innerHeight - BUTTON_H - EDGE_PAD - 60, y)),
  }), [])

  // ── TOUCH ──────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragRef.current = { active: true, startX: t.clientX, startY: t.clientY, originX: pos.x, originY: pos.y, moved: false }
    setDragging(false)
  }, [pos])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.active) return
    const t = e.touches[0]
    const dx = t.clientX - dragRef.current.startX
    const dy = t.clientY - dragRef.current.startY
    if (!dragRef.current.moved && Math.hypot(dx, dy) < 6) return
    dragRef.current.moved = true
    setDragging(true)
    if (fabOpen) setFabOpen(false)
    setPos(clamp(dragRef.current.originX + dx, dragRef.current.originY + dy))
  }, [clamp, fabOpen, setFabOpen])

  const onTouchEnd = useCallback(() => {
    dragRef.current.active = false
    if (!dragRef.current.moved) {
      // È un tap
      setFabOpen(!fabOpen)
    }
    setDragging(false)
  }, [fabOpen, setFabOpen])

  // ── MOUSE ──────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y, moved: false }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      if (!dragRef.current.moved && Math.hypot(dx, dy) < 6) return
      dragRef.current.moved = true
      setDragging(true)
      if (fabOpen) setFabOpen(false)
      setPos(clamp(dragRef.current.originX + dx, dragRef.current.originY + dy))
    }

    const onUp = () => {
      dragRef.current.active = false
      if (!dragRef.current.moved) setFabOpen(!fabOpen)
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos, clamp, fabOpen, setFabOpen])

  // Non renderizzare finché posizione non inizializzata
  if (pos.x === -1) return null

  // Decide se aprire il menu sopra o sotto il FAB
  const menuAbove = pos.y > window.innerHeight / 2

  return (
    <>
      {/* Overlay chiude menu */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 89, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* FAB container */}
      <div
        ref={fabRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 90,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Menu */}
        {menuVisible && (
          <div style={{
            position: 'absolute',
            [menuAbove ? 'bottom' : 'top']: BUTTON_H + 10,
            right: 0,
            minWidth: 220,
            background: '#0B1F2A',
            borderRadius: 14,
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            opacity: fabOpen ? 1 : 0,
            transform: fabOpen
              ? 'scale(1) translateY(0)'
              : `scale(0.92) translateY(${menuAbove ? '8px' : '-8px'})`,
            transformOrigin: menuAbove ? 'bottom right' : 'top right',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            pointerEvents: fabOpen ? 'all' : 'none',
          }}>
            {children}
          </div>
        )}

        {/* Bottone principale */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            width: BUTTON_W,
            height: BUTTON_H,
            borderRadius: '50%',
            background: fabOpen ? '#1a3a4a' : acc,
            boxShadow: dragging
              ? `0 12px 32px ${acc}80`
              : fabOpen
              ? `0 4px 20px rgba(0,0,0,0.5)`
              : `0 4px 16px ${acc}60`,
            cursor: dragging ? 'grabbing' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: dragging ? 'none' : 'background 0.2s, box-shadow 0.2s, transform 0.15s',
            transform: dragging ? 'scale(1.1)' : fabOpen ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          {/* Icona */}
          {fabOpen ? (
            // X chiudi
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            // Stelle MASTRO
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill="white" opacity="1"/>
              <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" fill="white" opacity="0.7"/>
              <path d="M6 16l.5 1.5L8 18l-1.5.5L6 20l-.5-1.5L4 18l1.5-.5L6 16z" fill="white" opacity="0.5"/>
            </svg>
          )}
        </div>

        {/* Drag indicator — piccolo punto sotto il FAB */}
        {!fabOpen && (
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            transition: 'opacity 0.2s',
          }} />
        )}
      </div>
    </>
  )
}

export default DraggableFAB
