// context/PanelContext.tsx
'use client'
import { createContext, useContext, useState, FC, ReactNode, useCallback } from 'react'
import type { PanelObject } from '@/components/Universal/DetailPanel'

interface PanelContextType {
  panelObj: PanelObject | null
  openPanel: (obj: PanelObject) => void
  closePanel: () => void
  navigatePanel: (obj: PanelObject) => void
}

const PanelContext = createContext<PanelContextType>({
  panelObj: null,
  openPanel: () => {},
  closePanel: () => {},
  navigatePanel: () => {},
})

export const PanelProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [panelObj, setPanelObj] = useState<PanelObject | null>(null)

  const openPanel = useCallback((obj: PanelObject) => setPanelObj(obj), [])
  const closePanel = useCallback(() => setPanelObj(null), [])
  const navigatePanel = useCallback((obj: PanelObject) => setPanelObj(obj), [])

  return (
    <PanelContext.Provider value={{ panelObj, openPanel, closePanel, navigatePanel }}>
      {children}
    </PanelContext.Provider>
  )
}

export const usePanel = () => useContext(PanelContext)
