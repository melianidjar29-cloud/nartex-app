// pages/auth.js
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const goPanel = () => (window.location.href = '/panel-cliente')

  // Crea fila mínima en `clientes` si no existe (user_id + email)
  const ensureCliente = async () => {
    const { data: u } = await supabase.auth.getUser()
    const userId = u?.user?.id
    const userEmail = u?.user?.email
    if (!userId) return

    const { data: cli } = await supabase
      .from('clientes')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!cli) {
      await supabase.from('clientes').insert([{ user_id: userId, email: userEmail }])
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) return setError(error.message)

    // crea cliente si falta y va al panel
    await ensureCliente()
    goPanel()
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null); setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setLoading(false); return setError(error.message) }

    // si no usás confirmación por email, iniciamos sesión directo
    await supabase.auth.signInWithPassword({ email, password }).catch(() => {})
    setLoading(false)

    // crea cliente si falta y va al panel
    await ensureCliente()
    goPanel()
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Login / Registro</h2>

      <form style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button onClick={handleSignIn} disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <button onClick={handleSignUp} disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </main>
  )
}
