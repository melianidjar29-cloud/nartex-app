// pages/perfil.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Perfil() {
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', empresa: '', telefono: '',
    cuit: '', condicion_iva: 'Responsable Inscripto', direccion_facturacion: ''
  })

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)

      // Traer perfil si existe
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) setMsg('No pude leer tu perfil: ' + error.message)
      if (data) {
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          empresa: data.empresa || '',
          telefono: data.telefono || '',
          cuit: data.cuit || '',
          condicion_iva: data.condicion_iva || 'Responsable Inscripto',
          direccion_facturacion: data.direccion_facturacion || ''
        })
      }
      setCargando(false)
    })()
  }, [])

  const onChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }))

  const onSave = async (e) => {
    e.preventDefault()
    setMsg('')
    const payload = {
      user_id: user.id,
      email: user.email,
      ...form
    }
    const { error } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: 'user_id' })

    setMsg(error ? '❌ ' + error.message : '✅ Perfil guardado')
    if (!error) setTimeout(() => (window.location.href = '/panel-cliente'), 600)
  }

  if (cargando) return <p style={{padding:24}}>Cargando…</p>

  return (
    <main style={{padding:24, fontFamily:'sans-serif', maxWidth:640, margin:'0 auto'}}>
      <h2>Mi perfil</h2>
      <form onSubmit={onSave} style={{display:'grid', gap:12, marginTop:12}}>
        <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr'}}>
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

        {msg && <p style={{margin:0, color: msg.startsWith('✅') ? 'green' : 'crimson'}}>{msg}</p>}

        <button type="submit">Guardar</button>
      </form>

      <div style={{marginTop:16}}>
        <a href="/panel-cliente">Volver al panel</a>
      </div>
    </main>
  )
}
