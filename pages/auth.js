import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [modoLogin, setModoLogin] = useState(true)
  const [msg, setMsg] = useState('')

  // comunes
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // datos de perfil (solo para registro)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cuit, setCuit] = useState('')
  const [condIva, setCondIva] = useState('Responsable Inscripto')
  const [dirFact, setDirFact] = useState('')

  const irAlPanel = () => { window.location.href = '/panel' }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      if (modoLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        irAlPanel()
        return
      }

      // REGISTRO COMPLETO
      if (!nombre || !apellido || !telefono || !cuit || !dirFact) {
        setMsg('Completá todos los campos obligatorios.')
        return
      }

      // 1) Crear usuario
      const { error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) throw signUpErr

      // Si la confirmación por email está desactivada, ya hay sesión.
      // Si está activada, este paso requeriría confirmación previa.
      // Para evitar líos, intentamos asegurar sesión:
      await supabase.auth.signInWithPassword({ email, password }).catch(()=>{})

      // 2) Obtener user_id actual
      const { data: udata } = await supabase.auth.getUser()
      const userId = udata?.user?.id
      if (!userId) throw new Error('No se pudo obtener el usuario recién creado.')

      // 3) Guardar/actualizar perfil en public.clientes
      const payload = {
        user_id: userId,
        email,
        nombre,
        apellido,
        empresa,
        telefono,
        cuit,
        condicion_iva: condIva,
        direccion_facturacion: dirFact
      }

      const { error: upsertErr } = await supabase
        .from('clientes')
        .upsert(payload, { onConflict: 'user_id' })

      if (upsertErr) throw upsertErr

      setMsg('✅ Cuenta creada. Redirigiendo al panel…')
      setTimeout(irAlPanel, 600)

    } catch (err) {
      setMsg('❌ ' + (err?.message || 'Error desconocido'))
    }
  }

  return (
    <main style={{padding: 24, fontFamily: 'sans-serif', maxWidth: 520, margin: '0 auto'}}>
      <h2>{modoLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>

      <form onSubmit={onSubmit} style={{display:'grid', gap:12, marginTop:12}}>
        {!modoLogin && (
          <>
            <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
              <input placeholder="Nombre*" value={nombre} onChange={e=>setNombre(e.target.value)} required />
              <input placeholder="Apellido*" value={apellido} onChange={e=>setApellido(e.target.value)} required />
            </div>
            <input placeholder="Empresa" value={empresa} onChange={e=>setEmpresa(e.target.value)} />
            <input placeholder="Teléfono*" value={telefono} onChange={e=>setTelefono(e.target.value)} required />
            <input placeholder="CUIT*" value={cuit} onChange={e=>setCuit(e.target.value)} required />
            <label>Condición frente al IVA
              <select value={condIva} onChange={e=>setCondIva(e.target.value)}>
                <option>Responsable Inscripto</option>
                <option>Monotributista</option>
                <option>Exento</option>
                <option>Consumidor Final</option>
              </select>
            </label>
            <input placeholder="Dirección de facturación*" value={dirFact} onChange={e=>setDirFact(e.target.value)} required />
          </>
        )}

        <input type="email" placeholder="Email*" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña*" value={password} onChange={e=>setPassword(e.target.value)} required />

        <button type="submit">{modoLogin ? 'Entrar' : 'Crear cuenta'}</button>
      </form>

      {msg && <p style={{marginTop:10}}>{msg}</p>}

      <button onClick={()=>setModoLogin(!modoLogin)} style={{marginTop:12}}>
        {modoLogin ? 'No tengo cuenta' : 'Ya tengo cuenta'}
      </button>
    </main>
  )
}
