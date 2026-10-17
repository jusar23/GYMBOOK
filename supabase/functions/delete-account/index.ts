import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const adminKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' })
  if (!supabaseUrl || !anonKey || !adminKey) {
    console.error('Supabase account deletion secrets are not configured')
    return reply(503, { error: 'Account deletion is not configured on the server.' })
  }

  const authorization = req.headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token) return reply(401, { error: 'Sign in again before deleting your account.' })

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser(token)
  if (userError || !user?.id) return reply(401, { error: 'Your session expired. Sign in again and retry.' })

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
  if (deleteError) {
    console.error('Supabase account deletion failed', user.id, deleteError.message)
    return reply(500, {
      error: 'Supabase could not delete the account.',
      details: deleteError.message,
    })
  }

  return reply(200, { ok: true })
})
