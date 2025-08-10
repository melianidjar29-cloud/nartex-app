// pages/index.js
import Link from 'next/link'
export default function Home() {
  return (
    <main style={{padding:'2rem', fontFamily:'sans-serif', textAlign:'center'}}>
      <h1>Nartex</h1>
      <p>Accedé a tu cuenta o creá una nueva.</p>
      <div style={{display:'flex', gap:'1rem', justifyContent:'center', marginTop:'2rem'}}>
        <Link href="/auth?view=sign_in"><button style={btn}>Iniciar sesión</button></Link>
       <Link href="/registro"><button style={btnOutline}>Crear cuenta</button></Link>

      </div>
    </main>
  )
}
const btn = {padding:'0.75rem 1.5rem', border:'none', borderRadius:8, background:'#111827', color:'#fff', cursor:'pointer'}
const btnOutline = {...btn, background:'#fff', color:'#111827', border:'1px solid #111827'}
