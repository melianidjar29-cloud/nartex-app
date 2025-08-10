// pages/registro.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', empresa: '',
    telefono: '', cuit: '', condicion_iva: 'Responsable Inscripto',
    direccion_facturacion: '', email: '', password: ''
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Si ya hay sesión, no permito registro: voy al panel
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

  const onChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      // 1) crear usuario en Auth
      const { data, error: eSign } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })
      if (eSign) throw eSign

      // 2) si la confirmación de email está desactivada, intento loguear directo
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      }).catch(() => {})

      // 3) obtener user actual (puede ser null si hay confirmación por email)
      const { data: u } = await supabase.auth.getUser()
      const userId = u?.user?.id
      const userEmail = u?.user?.email || form.email

      if (!userId) {
        setMsg('Registro creado. Revisá tu email para confirmar la cuenta y después iniciá sesión.')
        return
      }

      // 4) upsert del perfil en public.clientes (clave por user_id)
      const payload = {
        user_id: userId,
        email: userEmail,
        nombre: form.nombre,
        apellido: form.apellido,
        empresa: form.empresa,
        telefono: form.telefono,
        cuit: form.cuit,
        condicion_iva: form.condicion_iva,
        direccion_facturacion: form.direccion_facturacion
      }

      const { error: eUpsert } = await supabase
        .from('clientes')
        .upsert(payload, { onConflict: 'user_id' })

      if (eUpsert) throw eUpsert

      // 5) al panel
      window.location.href = '/panel-cliente'
    } catch (err) {
      setMsg('❌ ' + (err?.message || 'No se pudo completar el registro'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Crear cuenta</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input name="nombre" placeholder="Nombre *" value={form.nombre} onChange={onChange} required />
          <input name="apellido" placeholder="Apellido *" value={form.apellido} onChange={onChange} required />
        </div>
        <input name="empresa" placeholder="Empresa" value={form.empresa} onChange={onChange} />
        <input name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={onChange} required />
        <input name="cuit" placeholder="CUIT *" value={form.cuit} onChange={onChange} required />
        <label>Condición frente al IVA
          <select name="condicion_iva" value={form.condicion_iva} onChange={onChange}>
            <option>Responsable Inscripto</option>
            <option>Monotributista</option>
            <option>Exento</option>
            <option>Consumidor Final</option>
          </select>
        </label>
        <input name="direccion_facturacion" placeholder="Dirección de facturación *"
               value={form.direccion_facturacion} onChange={onChange} required />
        <input type="email" name="email" placeholder="Email *" value={form.email} onChange={onChange} required />
        <input type="password" name="password" placeholder="Contraseña *"
               value={form.password} onChange={onChange} required />

        {msg && <p style={{ color: 'crimson', marginTop: 4 }}>{msg}</p>}

        <button disabled={loading}>{loading ? 'Creando...' : 'Registrarme'}</button>
      </form>

      <p style={{ marginTop: 16 }}>
        ¿Ya tenés cuenta? <a href="/auth?view=sign_in">Iniciar sesión</a>
      </p>
    </main>
  )
}
