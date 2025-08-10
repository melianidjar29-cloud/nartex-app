// pages/auth.js
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const goPanel = () => (window.location.href = '/panel-cliente')

  // Crea/asegura la fila en `clientes` para el usuario logueado
  const ensureCliente = async () => {
    const { data: u, error: eu } = await supabase.auth.getUser()
    if (eu) throw eu
    const userId = u?.user?.id
    const userEmail = u?.user?.email
    if (!userId) throw new Error('No hay usuario en sesión.')

    // ¿ya existe?
    const { data: cli, error: sErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (sErr) throw sErr
    if (cli) return cli.id

    // crear (o actualizar si justo existe)
    const { data: ins, error: iErr } = await supabase
      .from('clientes')
      .upsert(
        [{ user_id: userId, email: userEmail }],
        { onConflict: 'user_id' }
      )
      .select('id')
      .maybeSingle()

    if (iErr) throw iErr
    return ins?.id
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setMsg(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      await ensureCliente()
      goPanel()
    } catch (err) {
      setMsg('❌ ' + (err?.message || 'Error al iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setMsg(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // si no usás confirmación, iniciá sesión; si sí, este paso puede fallar hasta confirmar
      await supabase.auth.signInWithPassword({ email, password }).catch(()=>{})

      await ensureCliente()
      goPanel()
    } catch (err) {
      setMsg('❌ ' + (err?.message || 'Error al registrarse'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Login / Registro</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <input type="email" placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
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
