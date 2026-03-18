"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type LogEntry = { ok: boolean; msg: string }

export default function ImportPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const addLog = (ok: boolean, msg: string) =>
    setLogs(prev => [...prev, { ok, msg }])

  async function runImport() {
    setRunning(true)
    setLogs([])
    setDone(false)

    try {
      const res = await fetch("/mastro-import-v1.json")
      const data = await res.json()

      // 1. RIMUOVI PROGETTI VECCHI
      addLog(true, "Rimozione progetti obsoleti...")
      for (const name of data.projects_to_remove) {
        const { error } = await supabase
          .from("progetti")
          .delete()
          .ilike("nome", name)
        if (error) addLog(false, "Errore rimozione " + name + ": " + error.message)
        else addLog(true, "Rimosso: " + name)
      }

      // 2. UPSERT PROGETTO MASTRO ERP
      addLog(true, "Inserimento progetto MASTRO ERP...")
      for (const p of data.projects) {
        const { error } = await supabase.from("progetti").upsert({
          id: p.id,
          nome: p.name,
          colore: p.color,
          stato: p.status,
          mrr: p.mrr,
          mrr_target: p.target_mrr,
          data_lancio: p.launch_date,
          descrizione: p.description,
        }, { onConflict: "id" })
        if (error) addLog(false, "Errore progetto: " + error.message)
        else addLog(true, "Progetto OK: " + p.name)
      }

      // 3. UPSERT SPESE
      addLog(true, "Inserimento costi mensili...")
      for (const c of data.costs) {
        const { error } = await supabase.from("spese_correnti").upsert({
          nome: c.name,
          importo: c.amount,
          valuta: c.currency,
          categoria: c.category,
          ricorrenza: c.recurring,
          note: c.note || null,
        }, { onConflict: "nome" })
        if (error) addLog(false, "Errore spesa " + c.name + ": " + error.message)
        else addLog(true, "Spesa OK: " + c.name)
      }

      // 4. UPSERT TASK
      addLog(true, "Inserimento task...")
      for (const t of data.tasks) {
        const { error } = await supabase.from("tasks").upsert({
          id: t.id,
          titolo: t.title,
          assegnato_a: t.owner,
          progetto_id: t.project,
          priorita: t.priority,
          stato: t.status,
          scadenza: t.due_date || null,
          tags: t.tags,
        }, { onConflict: "id" })
        if (error) addLog(false, "Errore task " + t.id + ": " + error.message)
        else addLog(true, "Task OK: " + t.title)
      }

      // 5. TASK RICORRENTI
      addLog(true, "Inserimento task ricorrenti...")
      for (const r of data.recurring_tasks) {
        const { error } = await supabase.from("tasks").insert({
          titolo: r.title,
          assegnato_a: r.owner,
          ricorrente: true,
          frequenza: r.frequency,
          giorno: r.day || null,
          tags: r.tags,
          stato: "open",
        })
        if (error) addLog(false, "Errore ricorrente " + r.title + ": " + error.message)
        else addLog(true, "Ricorrente OK: " + r.title)
      }

      addLog(true, "--- IMPORT COMPLETATO ---")
      setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      addLog(false, "Errore fatale: " + msg)
    }

    setRunning(false)
  }

  return (
    <div style={{ padding: 32, fontFamily: "Inter, sans-serif", maxWidth: 700 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Import Dati MASTRO
      </h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Popola il workspace con tutti i dati reali da mastro-import-v1.json
      </p>

      <button
        onClick={runImport}
        disabled={running}
        style={{
          background: running ? "#ccc" : "#14B8A6",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "12px 28px",
          fontSize: 16,
          fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {running ? "Import in corso..." : "Avvia Import"}
      </button>

      {logs.length > 0 && (
        <div style={{
          background: "#0B1F2A",
          borderRadius: 8,
          padding: 20,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          maxHeight: 500,
          overflowY: "auto",
        }}>
          {logs.map((l, i) => (
            <div key={i} style={{ color: l.ok ? "#1A9E73" : "#DC4444", marginBottom: 4 }}>
              {l.ok ? "✓" : "✗"} {l.msg}
            </div>
          ))}
        </div>
      )}

      {done && (
        <div style={{
          marginTop: 24,
          background: "#f0fdf9",
          border: "1px solid #1A9E73",
          borderRadius: 8,
          padding: 16,
          color: "#1A9E73",
          fontWeight: 600,
        }}>
          Import completato. Vai alla dashboard per vedere i dati.
        </div>
      )}
    </div>
  )
}
