// context/PanelContext.tsx
'use client'
import { createContext, useContext, useState, FC, ReactNode } from 'react'
import type { PanelObject } from '@/components/Universal/DetailPanel'

interface PanelContextType {
  panelObj: PanelObject | null
  openPanel: (obj: PanelObject) => void
  closePanel: () => void
}

const PanelContext = createContext<PanelContextType>({
  panelObj: null,
  openPanel: () => {},
  closePanel: () => {},
})

export const PanelProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [panelObj, setPanelObj] = useState<PanelObject | null>(null)
  return (
    <PanelContext.Provider value={{
      panelObj,
      openPanel: (obj) => setPanelObj(obj),
      closePanel: () => setPanelObj(null),
    }}>
      {children}
    </PanelContext.Provider>
  )
}

export const usePanel = () => useContext(PanelContext)
