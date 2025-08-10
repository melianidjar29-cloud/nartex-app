// pages/panel_cliente.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function PanelCliente() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Obtener cliente_id
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cliente) {
        window.location.href = '/perfil';
        return;
      }

      // Traer pedidos de ese cliente
      const { data: pedidosData, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('fecha_creacion', { ascending: false });

      if (error) console.error(error);
      else setPedidos(pedidosData);

      setLoading(false);
    };

    fetchPedidos();
  }, []);

  if (loading) return <p>Cargando panel...</p>;

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Panel de Cliente</h1>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/nuevo-pedido">➕ Crear nuevo pedido</Link> |{' '}
        <Link href="/pagos">💳 Gestionar pagos</Link>
      </nav>

      <h2>Mis pedidos</h2>
      {pedidos.length === 0 ? (
        <p>No tenés pedidos todavía.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Servicios</th>
              <th>Fecha creación</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.estado}</td>
                <td>{p.servicios_basicos}</td>
                <td>{new Date(p.fecha_creacion).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Material editado</h2>
      <p>(Acá se mostrarán los links al material una vez esté editado)</p>
    </main>
  );
}
