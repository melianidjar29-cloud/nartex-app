import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PanelCliente() {
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [user, setUser] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    (async () => {
      setMsg('')
      // 1) sesión
      const { data: { session }, error: sesErr } = await supabase.auth.getSession()
      if (sesErr) { setMsg('No pude leer la sesión.'); setCargando(false); return }
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)

      // 2) perfil del cliente (puede NO existir aún)
      const { data: cli, error: cliErr } = await supabase
        .from('clientes')
        .select('id, nombre, apellido, empresa')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (cliErr) {
        setMsg('No puedo leer tu perfil (permisos o RLS). ' + cliErr.message)
        setCargando(false)
        return
      }

      if (!cli) {
        // sin perfil: CTA para completarlo (no redirijo solo)
        setCliente(null)
        setPedidos([])
        setCargando(false)
        return
      }

      setCliente(cli)

      // 3) pedidos del cliente (si no existen tablas relacionadas, igual carga)
      const { data: peds, error: pedErr } = await supabase
        .from('pedidos')
        .select(`
          id,
          estado,
          created_at,
          precio_final,
          propiedad_id,
          entregas:entregas ( id, tipo, url, estado ),
          pagos:pagos ( id, tipo_pago, monto, estado, created_at )
        `)
        .eq('cliente_id', cli.id)
        .order('created_at', { ascending: false })

      if (pedErr) {
        // si tus tablas entregas/pagos aún no existen, no frenes el panel
        setMsg('Pedidos cargados sin vínculos (entregas/pagos no disponibles aún).')
        setPedidos(peds || [])
      } else {
        setPedidos(peds || [])
      }

      setCargando(false)
    })()
  }, [])

  const resumenPedido = (p) => {
    const finales = (p?.entregas || []).filter(e => (e?.tipo || '').toLowerCase() === 'final')
    const descarga =
      finales.find(e => (e?.estado || '').toLowerCase() === 'finalizado') ||
      finales[0] ||
      null

    const pagos = p?.pagos || []
    const res = pagos.find(x => x?.tipo_pago === 'reserva')
    const sal = pagos.find(x => x?.tipo_pago === 'saldo')

    return {
      descarga,
      pagoReserva: res ? (res.estado || 'pendiente') : 'pendiente',
      pagoSaldo: sal ? (sal.estado || 'pendiente') : 'pendiente'
    }
  }

  const salir = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (cargando) return <p style={{ padding: 24 }}>Cargando…</p>

  // Sin perfil aún
  if (!cliente) {
    return (
      <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
        <h2>Panel del cliente</h2>
        <p>No encontramos tu perfil. Para usar el panel, completá tus datos.</p>
        <a href="/perfil"><button>Completar mi perfil</button></a>
        {msg && <p style={{ color: 'crimson', marginTop: 12 }}>{msg}</p>}
        <div style={{ marginTop: 16 }}>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Panel de {cliente?.nombre} {cliente?.apellido}</h2>
          {cliente?.empresa && <small>Empresa: {cliente.empresa}</small>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/perfil"><button>Mi perfil</button></a>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      </header>

      <section style={{ marginBottom: 16 }}>
        <a href="/nuevo-pedido-multiple"><button>+ Crear nuevo pedido</button></a>
      </section>

      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}

      <section>
        <h3>Mis pedidos</h3>
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Material editado</th>
              <th>Pagos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 && (
              <tr><td colSpan="6">Todavía no tenés pedidos.</td></tr>
            )}
            {pedidos.map(p => {
              const r = resumenPedido(p)
              return (
                <tr key={p.id}>
                  <td>{p.id.slice(0, 8)}</td>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td>{p.estado}</td>
                  <td>
                    {r.descarga?.url
                      ? <a href={r.descarga.url} target="_blank" rel="noreferrer">Descargar</a>
                      : <span>—</span>}
                  </td>
                  <td>
                    <div>
                      <div>Reserva: <b>{r.pagoReserva}</b></div>
                      <div>Saldo: <b>{r.pagoSaldo}</b></div>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <a href="/nuevo-pedido-multiple">Repetir pedido</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </main>
  )
}
