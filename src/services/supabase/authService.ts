import { getSupabase } from '@/lib/supabase'
import type { AdminSession } from '@/types/domain'
import { ServiceError, type AuthService } from '../types'
import { toServiceError } from './errors'

/** Signed in is not enough: the user must also have an admin_profiles row. */
async function loadAdminProfile(userId: string, email: string): Promise<AdminSession> {
  const { data, error } = await getSupabase()
    .from('admin_profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw toServiceError(error)
  if (!data) throw new ServiceError('FORBIDDEN')
  return { email, displayName: data.display_name }
}

export const supabaseAuthService: AuthService = {
  async getSession() {
    const { data, error } = await getSupabase().auth.getSession()
    if (error) throw toServiceError(error)
    const user = data.session?.user
    if (!user) return null
    return loadAdminProfile(user.id, user.email ?? '')
  },

  async signIn(email, password) {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (error.status === 400 || error.code === 'invalid_credentials') throw new ServiceError('INVALID_CREDENTIALS')
      throw toServiceError(error)
    }
    try {
      return await loadAdminProfile(data.user.id, data.user.email ?? email)
    } catch (e) {
      await supabase.auth.signOut()
      throw e
    }
  },

  async signOut() {
    await getSupabase().auth.signOut()
  },
}
