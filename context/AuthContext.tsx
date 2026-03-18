// context/AuthContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  ruolo: 'owner' | 'admin' | 'member' | 'viewer'
  nome?: string
  cognome?: string
  colore?: string
  avatar_url?: string
}

interface Workspace {
  id: string
  nome: string
  slug: string
  piano: string
  trial_ends?: string
  colore?: string
  owner_id: string
}

interface AuthState {
  user: User | null
  session: Session | null
  workspace: Workspace | null
  member: WorkspaceMember | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  nomeDisplay: string
  coloreDisplay: string
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nome: string, cognome: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<WorkspaceMember>) => Promise<void>
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspace = async (userId: string) => {
    try {
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('user_id', userId)
        .eq('attivo', true)
        .single()

      if (memberData) {
        setMember(memberData)
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', memberData.workspace_id)
          .single()
        if (wsData) setWorkspace(wsData)
      }
    } catch (e) {
      console.warn('Workspace load error:', e)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadWorkspace(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) await loadWorkspace(session.user.id)
      else { setWorkspace(null); setMember(null) }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, nome: string, cognome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome, cognome } }
    })
    if (error) return { error: error.message }

    // Crea workspace automaticamente per il nuovo owner
    if (data.user) {
      const slug = `${nome.toLowerCase()}-${Date.now()}`
      const { data: ws } = await supabase.from('workspaces').insert({
        nome: `${nome} ${cognome} Workspace`,
        slug, owner_id: data.user.id, piano: 'trial'
      }).select().single()

      if (ws) {
        await supabase.from('workspace_members').insert({
          workspace_id: ws.id, user_id: data.user.id,
          ruolo: 'owner', nome, cognome, colore: '#0A8A7A'
        })
      }
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setWorkspace(null); setMember(null)
  }

  const updateProfile = async (data: Partial<WorkspaceMember>) => {
    if (!member) return
    await supabase.from('workspace_members').update(data).eq('id', member.id)
    setMember(prev => prev ? { ...prev, ...data } : null)
  }

  const nomeDisplay = member?.nome || user?.email?.split('@')[0] || 'Utente'
  const coloreDisplay = member?.colore || '#0A8A7A'
  const isOwner = member?.ruolo === 'owner'
  const isAdmin = member?.ruolo === 'owner' || member?.ruolo === 'admin'

  return (
    <AuthContext.Provider value={{
      user, session, workspace, member, loading,
      isOwner, isAdmin, nomeDisplay, coloreDisplay,
      signIn, signUp, signOut, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
