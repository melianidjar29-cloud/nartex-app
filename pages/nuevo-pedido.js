import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function NuevoPedido() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')

  // Campos mínimos (podés ampliar después)
  const [tipo, setTipo] = useState('Departamento')
  const [direccion, setDireccion] = useState('')
  const [barrio, setBarrio] = useState('')
  const [localidad, setLocalidad] = useState('CABA')

  // Servicios básicos (se guardan en pedidos.servicios_basicos JSONB)
  const [servicios, setServicios] = useState({
    fotos: true,
    plano: false,
    video_horizontal: false,
    tour_360: false,
  })

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)
      setLoading(false)
    })()
  }, [])

  const toggleServicio = (k) => setServicios(prev => ({ ...prev, [k]: !prev[k] }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!user) return

    try {
      // 1) buscar el cliente (tu tabla) por el user_id de Auth
      const { data: cli, error: cliErr } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (cliErr || !cli) {
        // si no tiene perfil completo, mandalo a completarlo
        window.location.href = '/perfil'
        return
      }
      const clienteId = cli.id

      // 2) crear propiedad (mínimo)
      const { data: prop, error: errProp } = await supabase
        .from('propiedades')
        .insert([{
          cliente_id: clienteId,
          tipo,
          direccion,
          barrio,
          localidad
        }])
        .select()
        .single()
      if (errProp) throw errProp

      // 3) crear pedido asociado (usa tu columna servicios_basicos)
      const { error: errPed } = await supabase
        .from('pedidos')
        .insert([{
          cliente_id: clienteId,
          propiedad_id: prop.id,
          servicios_basicos: servicios,
          estado: 'nuevo'
        }])
      if (errPed) throw errPed

      setMsg('✅ Pedido creado.')
      // limpiar formulario
      setDireccion('')
      setBarrio('')
      setLocalidad('CABA')
      setServicios({ fotos: true, plano: false, video_horizontal: false, tour_360: false })
    } catch (err) {
      setMsg('❌ Error: ' + (err?.message || 'algo salió mal'))
    }
  }

  if (loading) return <p style={{padding:24}}>Cargando…</p>

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 520, margin: '0 auto' }}>
      <h2>Nuevo pedido</h2>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <label>Tipo de propiedad
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option>Departamento</option>
            <option>Casa</option>
            <option>PH</option>
            <option>Local</option>
            <option>Oficina</option>
          </select>
        </label>

        <input
          placeholder="Dirección (obligatorio)"
          value={direccion}
          onChange={e=>setDireccion(e.target.value)}
          required
        />
        <input
          placeholder="Barrio"
          value={barrio}
          onChange={e=>setBarrio(e.target.value)}
        />
        <input
          placeholder="Localidad"
          value={localidad}
          onChange={e=>setLocalidad(e.target.value)}
        />

        <fieldset style={{ border: '1px solid #ddd', padding: 12 }}>
          <legend>Servicios básicos</legend>
          <label><input type="checkbox" checked={servicios.fotos} onChange={()=>toggleServicio('fotos')} /> Fotos</label><br/>
          <label><input type="checkbox" checked={servicios.plano} onChange={()=>toggleServicio('plano')} /> Plano</label><br/>
          <label><input type="checkbox" checked={servicios.video_horizontal} onChange={()=>toggleServicio('video_horizontal')} /> Video horizontal</label><br/>
          <label><input type="checkbox" checked={servicios.tour_360} onChange={()=>toggleServicio('tour_360')} /> Tour 360º</label>
        </fieldset>

        <button type="submit">Crear pedido</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <hr style={{ margin: '24px 0' }} />
      <a href="/panel">Ir a mi panel</a>
    </main>
  )
}
