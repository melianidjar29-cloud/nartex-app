import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthPage() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) window.location.href = '/panel-cliente'
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  return (
    <main style={{minHeight:'100vh', display:'grid', placeItems:'center', padding:24}}>
      <div style={{width:360}}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view={(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view')) || 'sign_in'}
          redirectTo={typeof window !== 'undefined' ? window.location.origin + '/panel-cliente' : undefined}
        />
      </div>
    </main>
  )
}
