import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { ApiError } from './envelope.ts';

export interface AuthContext {
  client: SupabaseClient;
  user: User;
  jwt: string;
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError('INTERNAL_ERROR', 'Supabase service credentials are not configured.', 500);
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace(/^Bearer\s+/i, '');
  if (!jwt) throw new ApiError('UNAUTHORIZED', 'Missing bearer token.', 401);

  const client = createServiceClient();
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) throw new ApiError('UNAUTHORIZED', 'Invalid or expired token.', 401);

  return { client, user: data.user, jwt };
}

export async function assertResumeOwner(client: SupabaseClient, resumeId: string, userId: string) {
  const { data, error } = await client
    .from('resumes')
    .select('id,user_id,title,template_id,job_role,ats_score')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new ApiError('INTERNAL_ERROR', error.message, 500);
  if (!data) throw new ApiError('RESUME_NOT_FOUND', 'Resume not found for this user.', 404);
  return data;
}
