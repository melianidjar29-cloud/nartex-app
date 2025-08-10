import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TALLY_BASE = 'https://tally.so/r/npP88J' // tu form

export default function NuevoPedidoEmbed() {
  const [cargando, setCargando] = useState(true)
  const [session, setSession] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [url, setUrl] = useState(TALLY_BASE)

  useEffect(() => {
    (async () => {
      // 1) sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setSession(session)

      // 2) buscar cliente por user_id (si no hay, mandá a completar perfil)
      const { data: cli } = await supabase
        .from('clientes')
        .select('id, email, nombre, apellido, empresa')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!cli) { window.location.href = '/perfil'; return }
      setCliente(cli)

      // 3) armar URL con parámetros útiles (por si querés leerlos en Tally)
      const q = new URLSearchParams({
        user_id: session.user.id,
        cliente_id: cli.id,
        email: cli.email || session.user.email || '',
        nombre: cli.nombre || '',
        apellido: cli.apellido || '',
        empresa: cli.empresa || ''
      })
      setUrl(`${TALLY_BASE}?${q.toString()}`)
      setCargando(false)
    })()
  }, [])

  if (cargando) return <p style={{padding:24}}>Cargando…</p>

  return (
    <main style={{padding: 0, fontFamily: 'sans-serif'}}>
      {/* Embed recomendado por Tally con auto-resize */}
      <iframe
        src={url}
        width="100%"
        height="100%"
        style={{border:0, minHeight:'100vh'}}
        title="Nuevo pedido"
      />
      {/* Enlace por si el embed fallara */}
      <div style={{position:'fixed', bottom:16, right:16}}>
        <a href={url} target="_blank" rel="noreferrer">
          Abrir formulario en otra pestaña
        </a>
      </div>
    </main>
  )
}
