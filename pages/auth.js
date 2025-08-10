import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [modoLogin, setModoLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (modoLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else window.location.href = '/' // listo, adentro
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg(error.message)
      else setMsg('Registro exitoso. Ahora podés iniciar sesión.')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <main style={{padding: 24, fontFamily: 'sans-serif', maxWidth: 420, margin: '0 auto'}}>
      <h2>{modoLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12, marginTop:12}}>
        <input
          type="email" placeholder="Email" value={email}
          onChange={e=>setEmail(e.target.value)} required
        />
        <input
          type="password" placeholder="Contraseña" value={password}
          onChange={e=>setPassword(e.target.value)} required
        />
        <button type="submit">{modoLogin ? 'Entrar' : 'Registrarme'}</button>
      </form>
      {msg && <p style={{color:'crimson', marginTop:10}}>{msg}</p>}
      <button onClick={()=>setModoLogin(!modoLogin)} style={{marginTop:12}}>
        {modoLogin ? 'No tengo cuenta' : 'Ya tengo cuenta'}
      </button>

      <hr style={{margin:'24px 0'}}/>
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  )
}

