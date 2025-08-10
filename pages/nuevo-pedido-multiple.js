import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// calculito simple de estimado (placeholder)
// ajustalo a tu regla real cuando quieras
function calcularEstimado({ unidades, serviciosBasicos, serviciosAdicionales }) {
  // base por unidad + extras
  let total = 0
  for (const u of unidades) {
    const amb = u.ambientes || {}
    const cantAmb = Object.values(amb).reduce((a, b) => a + (Number(b) || 0), 0)
    const baseUnidad = 20000 + cantAmb * 3000 // EJEMPLO: base 20k + 3k x ambiente
    total += baseUnidad
  }
  // extras globales
  if (serviciosBasicos?.plano) total += 15000
  if (serviciosBasicos?.tour_360) total += 12000
  if (serviciosAdicionales?.video_vertical) total += 8000
  if (serviciosAdicionales?.drone_exterior) total += 15000
  return total
}

export default function NuevoPedidoMultiple() {
  const [cargando, setCargando] = useState(true)
  const [user, setUser] = useState(null)
  const [clienteId, setClienteId] = useState(null)
  const [msg, setMsg] = useState('')

  // datos de la sesión
  const [direccion, setDireccion] = useState('')
  const [barrio, setBarrio] = useState('')
  const [localidad, setLocalidad] = useState('CABA')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('mañana')
  const [observaciones, setObservaciones] = useState('')

  // servicios
  const [serviciosBasicos, setServiciosBasicos] = useState({
    fotos: true,
    plano: false,
    video_horizontal: false,
    tour_360: false,
  })
  const [serviciosAdicionales, setServiciosAdicionales] = useState({
    video_vertical: false,
    fotos_verticales: false,
    drone_exterior: false,
    drone_interior: false,
    video_hablado: false,
  })

  // unidades de la sesión
  const [unidades, setUnidades] = useState([
    { piso_depto: '', ambientes: { living:1, comedor:0, cocina:1, banos:1, dormitorios:1 }, amenities: {}, sup_cubierta:'', sup_descubierta:'' }
  ])

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)

      // buscar cliente por user_id
      const { data: cli } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!cli) { window.location.href = '/perfil'; return }
      setClienteId(cli.id)
      setCargando(false)
    })()
  }, [])

  const toggleBasico = (k) => setServiciosBasicos(s => ({ ...s, [k]: !s[k] }))
  const toggleAdic = (k) => setServiciosAdicionales(s => ({ ...s, [k]: !s[k] }))

  const addUnidad = () => {
    setUnidades(u => [...u, { piso_depto: '', ambientes: { living:1, comedor:0, cocina:1, banos:1, dormitorios:1 }, amenities: {}, sup_cubierta:'', sup_descubierta:'' }])
  }

  const removeUnidad = (idx) => {
    setUnidades(u => u.filter((_, i) => i !== idx))
  }

  const setUnidadCampo = (idx, campo, valor) => {
    setUnidades(u => u.map((it, i) => i === idx ? { ...it, [campo]: valor } : it))
  }

  const setAmbiente = (idx, amb, valor) => {
    setUnidades(u => u.map((it, i) => {
      if (i !== idx) return it
      return { ...it, ambientes: { ...it.ambientes, [amb]: Number(valor || 0) } }
    }))
  }

  const estimado = calcularEstimado({ unidades, serviciosBasicos, serviciosAdicionales })

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!clienteId) return setMsg('No se pudo identificar al cliente.')

    try {
      // 1) crear SESIÓN
      const { data: ses, error: sErr } = await supabase
        .from('sesiones')
        .insert([{
          cliente_id: clienteId,
          direccion, barrio, localidad,
          fecha_preferida: fecha || null,
          turno,
          servicios_basicos: serviciosBasicos,
          servicios_adicionales: serviciosAdicionales,
          observaciones,
          estimate_total: estimado,
          estado: 'nuevo'
        }])
        .select()
        .single()
      if (sErr) throw sErr

      // 2) insertar UNIDADES (bulk)
      const payloadUnidades = unidades.map(u => ({
        sesion_id: ses.id,
        piso_depto: u.piso_depto,
        ambientes: u.ambientes,
        amenities: u.amenities || {},
        sup_cubierta: u.sup_cubierta ? Number(u.sup_cubierta) : null,
        sup_descubierta: u.sup_descubierta ? Number(u.sup_descubierta) : null
      }))

      const { error: uErr } = await supabase
        .from('sesion_unidades')
        .insert(payloadUnidades)
      if (uErr) throw uErr

      setMsg('✅ Pedido creado (múltiples unidades).')
      // limpiar
      setDireccion(''); setBarrio(''); setLocalidad('CABA')
      setFecha(''); setTurno('mañana'); setObservaciones('')
      setServiciosBasicos({ fotos: true, plano: false, video_horizontal: false, tour_360: false })
      setServiciosAdicionales({ video_vertical: false, fotos_verticales: false, drone_exterior: false, drone_interior: false, video_hablado: false })
      setUnidades([{ piso_depto: '', ambientes: { living:1, comedor:0, cocina:1, banos:1, dormitorios:1 }, amenities: {}, sup_cubierta:'', sup_descubierta:'' }])
    } catch (err) {
      setMsg('❌ ' + (err?.message || 'No se pudo crear el pedido.'))
    }
  }

  if (cargando) return <p style={{ padding: 24 }}>Cargando…</p>

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h2>Nuevo pedido (varias unidades en una dirección)</h2>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, marginTop: 12 }}>
        <section style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <input placeholder="Dirección *" value={direccion} onChange={e=>setDireccion(e.target.value)} required />
          <input placeholder="Barrio" value={barrio} onChange={e=>setBarrio(e.target.value)} />
          <input placeholder="Localidad" value={localidad} onChange={e=>setLocalidad(e.target.value)} />
        </section>

        <section style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label>Fecha preferida
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          </label>
          <label>Turno
            <select value={turno} onChange={e=>setTurno(e.target.value)}>
              <option value="mañana">Mañana (9–12)</option>
              <option value="tarde">Tarde (13–16)</option>
            </select>
          </label>
        </section>

        <fieldset style={{ border: '1px solid #ddd', padding: 12 }}>
          <legend>Servicios básicos</legend>
          <label><input type="checkbox" checked={serviciosBasicos.fotos} onChange={()=>toggleBasico('fotos')} /> Fotos</label><br/>
          <label><input type="checkbox" checked={serviciosBasicos.plano} onChange={()=>toggleBasico('plano')} /> Plano</label><br/>
          <label><input type="checkbox" checked={serviciosBasicos.video_horizontal} onChange={()=>toggleBasico('video_horizontal')} /> Video horizontal</label><br/>
          <label><input type="checkbox" checked={serviciosBasicos.tour_360} onChange={()=>toggleBasico('tour_360')} /> Tour 360º</label>
        </fieldset>

        <fieldset style={{ border: '1px solid #ddd', padding: 12 }}>
          <legend>Servicios adicionales</legend>
          <label><input type="checkbox" checked={serviciosAdicionales.video_vertical} onChange={()=>toggleAdic('video_vertical')} /> Video vertical</label><br/>
          <label><input type="checkbox" checked={serviciosAdicionales.fotos_verticales} onChange={()=>toggleAdic('fotos_verticales')} /> Fotos verticales</label><br/>
          <label><input type="checkbox" checked={serviciosAdicionales.drone_exterior} onChange={()=>toggleAdic('drone_exterior')} /> Drone exterior</label><br/>
          <label><input type="checkbox" checked={serviciosAdicionales.drone_interior} onChange={()=>toggleAdic('drone_interior')} /> Drone interior</label><br/>
          <label><input type="checkbox" checked={serviciosAdicionales.video_hablado} onChange={()=>toggleAdic('video_hablado')} /> Video hablado</label>
        </fieldset>

        <section>
          <h3>Unidades</h3>
          {unidades.map((u, idx) => (
            <div key={idx} style={{ border: '1px solid #eee', padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr' }}>
                <input placeholder="Piso / Depto / Casa / Timbre"
                  value={u.piso_depto}
                  onChange={e=>setUnidadCampo(idx, 'piso_depto', e.target.value)} />
                <input placeholder="Sup cubierta (m²)"
                  value={u.sup_cubierta}
                  onChange={e=>setUnidadCampo(idx, 'sup_cubierta', e.target.value)} />
                <input placeholder="Sup descubierta (m²)"
                  value={u.sup_descubierta}
                  onChange={e=>setUnidadCampo(idx, 'sup_descubierta', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 8 }}>
                <label>Living
                  <input type="number" min="0" value={u.ambientes.living}
                    onChange={e=>setAmbiente(idx,'living', e.target.value)} />
                </label>
                <label>Comedor
                  <input type="number" min="0" value={u.ambientes.comedor}
                    onChange={e=>setAmbiente(idx,'comedor', e.target.value)} />
                </label>
                <label>Cocina
                  <input type="number" min="0" value={u.ambientes.cocina}
                    onChange={e=>setAmbiente(idx,'cocina', e.target.value)} />
                </label>
                <label>Baños
                  <input type="number" min="0" value={u.ambientes.banos}
                    onChange={e=>setAmbiente(idx,'banos', e.target.value)} />
                </label>
                <label>Dormitorios
                  <input type="number" min="0" value={u.ambientes.dormitorios}
                    onChange={e=>setAmbiente(idx,'dormitorios', e.target.value)} />
                </label>
              </div>

              {unidades.length > 1 && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={()=>removeUnidad(idx)}>Eliminar esta unidad</button>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addUnidad}>+ Agregar otra unidad</button>
        </section>

        <label>Observaciones
          <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} />
        </label>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button type="submit">Crear pedido</button>
          <div>Estimado: <b>${(estimado || 0).toLocaleString('es-AR')}</b></div>
        </div>
      </form>
    </main>
  )
}
