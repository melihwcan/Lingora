import { supabase } from '../lib/supabaseClient'

export async function uploadAudioFile(file) {
  const timestamp = Date.now()
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${timestamp}_${sanitized}`

  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(filename, file, {
      contentType: file.type || 'audio/mpeg',
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function deleteAudioFile(publicUrl) {
  if (!publicUrl) return
  try {
    const url = new URL(publicUrl)
    const pathParts = url.pathname.split('/audio-files/')
    if (pathParts.length < 2) return
    const filename = pathParts[1]

    await supabase.storage
      .from('audio-files')
      .remove([filename])
  } catch (e) {
    console.warn('Could not delete old audio file:', e)
  }
}
