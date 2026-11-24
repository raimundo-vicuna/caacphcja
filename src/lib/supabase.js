import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY


export const configured = Boolean(url && key)
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        flowType: 'pkce',
      },
    })
  : null
export async function uploadImage(file, folder = 'general') {
  if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.')
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 5 MB.')
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('media')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
