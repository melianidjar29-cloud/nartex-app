import Link from 'next/link'

export default function HomeClientes() {
  return (
    <main style={{padding:'2rem', fontFamily:'sans-serif', textAlign:'center'}}>
      <h1>Clientes Nartex</h1>
      <p>Accedé a tu cuenta o creá una nueva.</p>

      <div style={{display:'flex', gap:'1rem', justifyContent:'center', marginTop:'2rem'}}>
        <Link href="/auth?mode=login">
          <button style={btnPrimary}>Iniciar sesión</button>
        </Link>
        <Link href="/auth?mode=signup">
          <button style={btnOutline}>Crear cuenta</button>
        </Link>
      </div>
    </main>
  )
}

const btnPrimary = {
  padding:'0.75rem 1.5rem',
  border:'none',
  borderRadius:8,
  background:'#111827',
  color:'#fff',
  cursor:'pointer',
  fontSize:'1rem'
}
const btnOutline = {
  ...btnPrimary,
  background:'#fff',
  color:'#111827',
  border:'1px solid #111827'
}
