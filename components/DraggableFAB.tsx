// components/DraggableFAB.tsx
'use client'
import { useRef, useState, FC } from 'react'

interface Props {
  fabOpen: boolean
  setFabOpen: (v: boolean) => void
  acc: string
  children?: React.ReactNode
}

const DraggableFAB: FC<Props> = ({ fabOpen, setFabOpen, acc, children }) => {
  const [posY, setPosY] = useState(40)
  const [side, setSide] = useState<'right' | 'left'>('right')
  const dragged = useRef(false)
  const origin = useRef({ y: 0, py: 0 })

  const clampY = (y: number) => Math.max(8, Math.min(78, y))

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    dragged.current = false
    origin.current = { y: e.touches[0].clientY, py: posY }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dy = e.touches[0].clientY - origin.current.y
    const pct = (dy / window.innerHeight) * 100
    if (Math.abs(pct) > 1) {
      dragged.current = true
      setPosY(clampY(origin.current.py + pct))
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (!dragged.current) {
      setFabOpen(!fabOpen)
    }
    dragged.current = false
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragged.current = false
    origin.current = { y: e.clientY, py: posY }
    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - origin.current.y
      const pct = (dy / window.innerHeight) * 100
      if (Math.abs(pct) > 1) {
        dragged.current = true
        setPosY(clampY(origin.current.py + pct))
      }
    }
    const onUp = () => {
      if (!dragged.current) setFabOpen(!fabOpen)
      dragged.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const isRight = side === 'right'
  const TAB_W = 30

  return (
    <>
      {fabOpen && (
        <div
          onTouchStart={e => { e.stopPropagation(); setFabOpen(false) }}
          onClick={() => setFabOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        />
      )}

      <div style={{
        position: 'fixed',
        [isRight ? 'right' : 'left']: 0,
        top: `${posY}%`,
        zIndex: 90,
        display: 'flex',
        flexDirection: isRight ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
        touchAction: 'none',
        userSelect: 'none',
      }}>

        {/* Pannello menu */}
        {fabOpen && (
          <div style={{
            width: 272,
            maxHeight: '75vh',
            background: '#0B1F2A',
            borderRadius: isRight ? '14px 0 0 14px' : '0 14px 14px 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isRight ? '-8px 0 40px rgba(0,0,0,0.5)' : '8px 0 40px rgba(0,0,0,0.5)',
            animation: 'fabSlide 0.18s ease',
          }}>
            <style>{`@keyframes fabSlide{from{opacity:0;transform:translateX(${isRight?'16px':'-16px'})}to{opacity:1;transform:translateX(0)}}`}</style>
            <div style={{ overflowY: 'auto', padding: '14px 12px', flex: 1 }}>
              {children}
            </div>
          </div>
        )}

        {/* Tab verticale */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Freccia su */}
          <div
            onTouchStart={e => { e.stopPropagation(); setPosY(p => clampY(p - 8)) }}
            onClick={() => setPosY(p => clampY(p - 8))}
            style={{ width: TAB_W, height: 22, background: '#065f46', borderRadius: isRight ? '8px 0 0 0' : '0 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 5L5 1L9 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* Tab principale */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            style={{
              width: fabOpen ? 44 : TAB_W,
              height: fabOpen ? 112 : 90,
              background: fabOpen ? '#1a3a4a' : acc,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: 'pointer', transition: 'all 0.2s ease',
              borderRadius: fabOpen ? (isRight ? '10px 0 0 10px' : '0 10px 10px 0') : 0,
            }}>
            {fabOpen ? (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 2l9 9M11 2l-9 9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <>
                <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
                  <path d="M1 9L4.5 1l3 5 3-5L14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, writingMode: 'vertical-rl', transform: 'rotate(180deg)', textTransform: 'uppercase', fontFamily: 'system-ui,sans-serif' }}>OS</span>
              </>
            )}
          </div>

          {/* Freccia giù */}
          <div
            onTouchStart={e => { e.stopPropagation(); setPosY(p => clampY(p + 8)) }}
            onClick={() => setPosY(p => clampY(p + 8))}
            style={{ width: TAB_W, height: 22, background: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* Switch lato */}
          <div
            onTouchStart={e => { e.stopPropagation(); setSide(s => s === 'right' ? 'left' : 'right'); setFabOpen(false) }}
            onClick={() => { setSide(s => s === 'right' ? 'left' : 'right'); setFabOpen(false) }}
            style={{ width: TAB_W, height: 22, background: '#0a2a1a', borderRadius: isRight ? '0 0 0 8px' : '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 1 }}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d={isRight ? "M8 1l3 3-3 3M1 4h10" : "M4 1L1 4l3 3M11 4H1"} stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}

export default DraggableFAB
