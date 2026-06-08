import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** PostgREST caps responses at 1000 rows; page until exhausted. */
export async function fetchPaginatedRows(buildQuery, pageSize = 1000) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await buildQuery(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}
