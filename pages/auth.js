// pages/auth.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Si ya hay sesión, mandamos al panel
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) window.location.href = '/panel-cliente'
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) window.location.href = '/panel-cliente'
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.href = '/panel-cliente'
    } catch (err) {
      setMsg('❌ ' + (err?.message || 'No se pudo iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }

  const irRegistro = () => (window.location.href = '/registro')

  return (
    <main style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:24, fontFamily:'sans-serif' }}>
      <div style={{ width: 380, maxWidth: '100%', border: '1px solid #eee', borderRadius: 8, padding: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Iniciar sesión</h2>
        <form onSubmit={onSubmit} style={{ display:'grid', gap: 12 }}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="tu@empresa.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </label>

          {msg && <p style={{ color: 'crimson', margin: 0 }}>{msg}</p>}

          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          <a href="/reset-password">¿Olvidaste tu contraseña?</a>
        </div>

        <hr style={{ margin: '16px 0' }} />

        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={irRegistro} style={btnSecondary}>Crear cuenta</button>
          <a href="/"><button style={btnGhost}>Volver al inicio</button></a>
        </div>
      </div>
    </main>
  )
}

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #ddd',
  fontSize: 14
}

const btnPrimary = {
  padding: '10px 14px',
  borderRadius: 6,
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 15
}

const btnSecondary = {
  ...btnPrimary,
  background: '#0ea5e9'
}

const btnGhost = {
  ...btnPrimary,
  background: '#fff',
  color: '#111827',
  border: '1px solid #ddd'
}
