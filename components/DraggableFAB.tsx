// components/DraggableFAB.tsx
'use client'
import { useRef, useState, useEffect, FC } from 'react'

interface Props {
  fabOpen: boolean
  setFabOpen: (v: boolean) => void
  acc: string
  children?: React.ReactNode
}

const DraggableFAB: FC<Props> = ({ fabOpen, setFabOpen, acc, children }) => {
  const [posY, setPosY] = useState(40) // percentuale dall'alto
  const dragged = useRef(false)
  const origin = useRef({ y: 0, py: 0 })

  const clampY = (y: number) => Math.max(8, Math.min(78, y))

  // ── TOUCH sul tab ─────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    dragged.current = false
    origin.current = { y: e.touches[0].clientY, py: posY }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const dy = e.touches[0].clientY - origin.current.y
    const pct = (dy / window.innerHeight) * 100
    if (Math.abs(pct) > 0.5) {
      dragged.current = true
      setPosY(clampY(origin.current.py + pct))
    }
  }

  const onTouchEnd = () => {
    if (!dragged.current) setFabOpen(!fabOpen)
  }

  // ── MOUSE sul tab ─────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragged.current = false
    origin.current = { y: e.clientY, py: posY }

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - origin.current.y
      const pct = (dy / window.innerHeight) * 100
      if (Math.abs(pct) > 0.5) {
        dragged.current = true
        setPosY(clampY(origin.current.py + pct))
      }
    }
    const onUp = () => {
      if (!dragged.current) setFabOpen(!fabOpen)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <>
      {/* Overlay chiude menu */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
        />
      )}

      {/* Container posizionato sul bordo destro */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: `${posY}%`,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        touchAction: 'none',
      }}>

        {/* Pannello menu — appare a sinistra del tab */}
        {fabOpen && (
          <div style={{
            width: 270,
            maxHeight: '75vh',
            background: '#0B1F2A',
            borderRadius: '14px 0 0 14px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.18s ease',
          }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
            <div style={{ overflowY: 'auto', padding: '14px 12px', flex: 1 }}>
              {children}
            </div>
          </div>
        )}

        {/* Tab verticale — bordo destro */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Freccia su */}
          <div style={{
            width: 28,
            height: 20,
            background: '#065f46',
            borderRadius: '8px 0 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 5L5 1L9 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Tab principale con scritto OS */}
          <div style={{
            width: 28,
            height: 86,
            background: fabOpen ? '#1a3a4a' : acc,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.2s',
          }}>
            {fabOpen ? (
              // X quando aperto
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : (
              <>
                {/* Logo M */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 9L4 1l3 5 3-5 3 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {/* Scritta OS verticale */}
                <span style={{
                  fontSize: 7,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.9)',
                  letterSpacing: 2,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  textTransform: 'uppercase',
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1,
                }}>OS</span>
              </>
            )}
          </div>

          {/* Freccia giù */}
          <div style={{
            width: 28,
            height: 20,
            background: '#065f46',
            borderRadius: '0 0 0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}

export default DraggableFAB
