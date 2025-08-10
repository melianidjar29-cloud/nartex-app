import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { auth_user_id, nombre, apellido, empresa, email, telefono, cuit, direccion_facturacion } = req.body || {}
  try {
    const { error } = await supabase
      .from('clientes')
      .upsert([{ auth_user_id, nombre, apellido, empresa, email, telefono, cuit, direccion_facturacion }], { onConflict: 'auth_user_id' })
    if (error) throw error
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}
