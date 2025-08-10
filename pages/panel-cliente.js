import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PanelCliente() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      setMsg('')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }
      setUser(session.user)

      // 1) Traer el cliente asociado a este usuario
      const { data: cli, error: cliErr } = await supabase
        .from('clientes')
        .select('id,nombre,apellido,empresa')
        .eq('user_id', session.user.id)
        .single()

      if (cliErr || !cli) { window.location.href = '/perfil'; return }
      setCliente(cli)

      // 2) Traer pedidos del cliente con entregas y pagos
      const { data: peds, error: pedErr } = await supabase
        .from('pedidos')
        .select(`
          id, estado, created_at, precio_final, propiedad_id,
          entregas:entregas ( id, tipo, url, estado ),
          pagos:pagos ( id, tipo_pago, monto, estado, created_at )
        `)
        .eq('cliente_id', cli.id)
        .order('created_at', { ascending: false })

      if (pedErr) setMsg('No pude cargar pedidos: ' + pedErr.message)
      setPedidos(peds || [])
      setLoading(false)
    })()
  }, [])

  const resumenPedido = (p) => {
    const finales = (p.entregas || []).filter(e => (e.tipo || '').toLowerCase() === 'final')
    const descarga =
      finales.fin
