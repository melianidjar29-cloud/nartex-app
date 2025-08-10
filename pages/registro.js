import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', empresa: '',
    telefono: '', cuit: '', condicion_iva: '',
    direccion_facturacion: '', email: '', password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1) Crear usuario en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })
      if (signUpError) throw signUpError

      // 2) Guardar datos adicionales en tabla clientes
      const { error: insertError } = await supabase.from('clientes').insert([{
        id_auth: data.user.id,
        nombre: form.nombre,
        apellido: form.apellido,
        empresa: form.empresa,
        telefono: form.telefono,
        cuit: form.cuit,
        condicion_iva: form.condicion_iva,
        direccion_facturacion: form.direccion_facturacion,
        email: form.email
      }])
      if (insertError) throw insertError

      setOk(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (ok) return <p>Registro exitoso. Revisá tu email para confirmar la cuenta.</p>

  return (
    <main style={{maxWidth:500, margin:'auto', padding:24, fontFamily:'sans-serif'}}>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit} style={{display:'grid', gap:'1rem'}}>
        <input name="nombre" placeholder="Nombre" onChange={handleChange} required />
        <input name="apellido" placeholder="Apellido" onChange={handleChange} required />
        <input name="empresa" placeholder="Empresa" onChange={handleChange} />
        <input name="telefono" placeholder="Teléfono" onChange={handleChange} required />
        <input name="cuit" placeholder="CUIT" onChange={handleChange} />
        <input name="condicion_iva" placeholder="Condición frente al IVA" onChange={handleChange} />
        <input name="direccion_facturacion" placeholder="Dirección de facturación" onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
        <button disabled={loading}>{loading ? 'Creando...' : 'Registrarme'}</button>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
    </main>
  )
}
