// components/Editor/RichEditor.tsx
// Editor markdown con preview live — sostituisce le textarea piatte
'use client'
import { FC, useState, useRef, useCallback } from 'react'
import { DS } from '@/constants/design-system'

const S = DS.colors

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number
  autoFocus?: boolean
}

// Converte markdown in HTML semplice per preview
function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 4px;color:#0D1117">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;margin:14px 0 6px;color:#0D1117">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;margin:16px 0 8px;color:#0D1117">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:1px 5px;borderRadius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/^\- \[x\] (.+)$/gm, '<div style="display:flex;gap:6px;align-items:center;padding:2px 0"><span style="color:#0A8A7A;font-size:13px">☑</span><span style="text-decoration:line-through;color:#9CA3AF">$1</span></div>')
    .replace(/^\- \[ \] (.+)$/gm, '<div style="display:flex;gap:6px;align-items:center;padding:2px 0"><span style="color:#D1D5DB;font-size:13px">☐</span>$1</div>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:6px;padding:2px 0"><span style="color:#0A8A7A">•</span>$1</div>')
    .replace(/^\d+\. (.+)$/gm, (_, text, offset, str) => {
      const num = str.slice(0, offset).match(/^\d+\./gm)?.length || 0
      return `<div style="display:flex;gap:6px;padding:2px 0"><span style="color:#9CA3AF;min-width:16px">${num + 1}.</span>${text}</div>`
    })
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E5E7EB;margin:12px 0">')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#0A8A7A;text-decoration:underline">$1</a>')
    .replace(/\n/g, '<br>')
}

// Toolbar button
const TB: FC<{ icon: string; title: string; onClick: () => void; active?: boolean }> = ({ icon, title, onClick, active }) => (
  <button onClick={onClick} title={title}
    style={{ padding: '4px 8px', background: active ? S.tealLight : 'none', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13, color: active ? S.teal : S.textSecondary, fontFamily: 'inherit' }}>
    {icon}
  </button>
)

export const RichEditor: FC<Props> = ({ value, onChange, placeholder = 'Scrivi qui...', minRows = 6, autoFocus }) => {
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrap = useCallback((before: string, after: string = before) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newVal)
    setTimeout(() => {
      ta.selectionStart = start + before.length
      ta.selectionEnd = end + before.length
      ta.focus()
    }, 0)
  }, [value, onChange])

  const insertLine = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(newVal)
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + prefix.length }, 0)
  }, [value, onChange])

  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden', background: S.surface }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: `1px solid ${S.borderLight}`, background: S.background, flexWrap: 'wrap' }}>
        <TB icon="B" title="Grassetto (**testo**)" onClick={() => wrap('**')} />
        <TB icon="I" title="Corsivo (*testo*)" onClick={() => wrap('*')} />
        <TB icon="S̶" title="Barrato (~~testo~~)" onClick={() => wrap('~~')} />
        <TB icon="`" title="Codice inline" onClick={() => wrap('`')} />
        <div style={{ width: 1, height: 16, background: S.border, margin: '0 4px' }} />
        <TB icon="H1" title="Titolo grande" onClick={() => insertLine('# ')} />
        <TB icon="H2" title="Titolo medio" onClick={() => insertLine('## ')} />
        <TB icon="H3" title="Titolo piccolo" onClick={() => insertLine('### ')} />
        <div style={{ width: 1, height: 16, background: S.border, margin: '0 4px' }} />
        <TB icon="•" title="Lista puntata" onClick={() => insertLine('- ')} />
        <TB icon="☐" title="Checklist" onClick={() => insertLine('- [ ] ')} />
        <TB icon="1." title="Lista numerata" onClick={() => insertLine('1. ')} />
        <TB icon="—" title="Separatore" onClick={() => { onChange(value + '\n---\n') }} />
        <div style={{ marginLeft: 'auto' }}>
          <TB icon={preview ? '✏️' : '👁'} title={preview ? 'Modifica' : 'Anteprima'} onClick={() => setPreview(!preview)} active={preview} />
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          style={{ padding: '12px 14px', minHeight: minRows * 24, fontSize: 13, lineHeight: 1.8, color: S.textPrimary, fontFamily: DS.fonts.ui }}
          dangerouslySetInnerHTML={{ __html: mdToHtml(value) || `<span style="color:${S.textMuted}">${placeholder}</span>` }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={minRows}
          style={{
            width: '100%', padding: '12px 14px', border: 'none', outline: 'none',
            resize: 'vertical', fontSize: 13, fontFamily: DS.fonts.ui,
            lineHeight: 1.8, color: S.textPrimary, background: 'transparent',
            boxSizing: 'border-box',
          }}
          onKeyDown={e => {
            // Tab = 2 spazi
            if (e.key === 'Tab') {
              e.preventDefault()
              const ta = e.currentTarget
              const s = ta.selectionStart
              const newVal = value.slice(0, s) + '  ' + value.slice(ta.selectionEnd)
              onChange(newVal)
              setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2 }, 0)
            }
            // Enter su lista — continua lista
            if (e.key === 'Enter') {
              const ta = e.currentTarget
              const s = ta.selectionStart
              const lineStart = value.lastIndexOf('\n', s - 1) + 1
              const line = value.slice(lineStart, s)
              const listMatch = line.match(/^(- \[[ x]\] |- |\d+\. )/)
              if (listMatch) {
                e.preventDefault()
                const prefix = listMatch[1].startsWith('- [') ? '- [ ] ' : listMatch[1]
                const newVal = value.slice(0, s) + '\n' + prefix + value.slice(s)
                onChange(newVal)
                setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 1 + prefix.length }, 0)
              }
            }
          }}
        />
      )}

      {/* Footer */}
      <div style={{ padding: '4px 10px', borderTop: `1px solid ${S.borderLight}`, display: 'flex', justifyContent: 'space-between', background: S.background }}>
        <span style={{ fontSize: 10, color: S.textMuted }}>Markdown supportato · **grassetto** *corsivo* `codice` - lista - [ ] checklist</span>
        <span style={{ fontSize: 10, color: S.textMuted }}>{value.length} caratteri</span>
      </div>
    </div>
  )
}
