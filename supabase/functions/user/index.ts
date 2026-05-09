import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { ApiError, errorResponse, json } from '../_shared/envelope.ts';
import { requireUser } from '../_shared/supabase.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();
    if (path !== 'data' || !['GET', 'DELETE'].includes(req.method)) {
      throw new ApiError('METHOD_NOT_ALLOWED', 'Use GET or DELETE /functions/v1/user/data.', 405);
    }

    const { client, user } = await requireUser(req);

    if (req.method === 'GET') return await exportUserData(client, user.id);

    const { data: profile } = await client.from('profiles').select('email').eq('id', user.id).maybeSingle();
    const email = profile?.email ?? user.email ?? 'unknown';

    await removeStoragePrefix(client, 'resumes', user.id);
    await removeStoragePrefix(client, 'avatars', user.id);

    const tables = ['resume_exports', 'ai_audit_log', 'rate_limits', 'resume_sections', 'resumes', 'profiles'];
    for (const table of tables) {
      if (table === 'resume_sections') {
        const resumeIds = (await client.from('resumes').select('id').eq('user_id', user.id)).data?.map((row) => row.id) ?? [];
        if (resumeIds.length) await client.from(table).delete().in('resume_id', resumeIds);
      } else {
        const column = table === 'profiles' ? 'id' : 'user_id';
        await client.from(table).delete().eq(column, user.id);
      }
    }

    await client.from('deletion_audit').insert({
      user_email: email,
      deleted_user: user.id,
      requested_by: 'user',
    });

    const { error: deleteError } = await client.auth.admin.deleteUser(user.id);
    if (deleteError) throw new ApiError('INTERNAL_ERROR', deleteError.message, 500);

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    return errorResponse(error);
  }
});

async function exportUserData(client: SupabaseClient, userId: string) {
  const [profile, resumes, auditLog, exports, rateLimit] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('ai_audit_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('resume_exports').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('rate_limits').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const resumeIds = resumes.data?.map((resume) => resume.id) ?? [];
  const sections = resumeIds.length
    ? await client.from('resume_sections').select('*').in('resume_id', resumeIds).order('sort_order', { ascending: true })
    : { data: [] };

  for (const result of [profile, resumes, auditLog, exports, rateLimit, sections]) {
    if (result.error) throw new ApiError('INTERNAL_ERROR', result.error.message, 500);
  }

  return json({
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    resumes: resumes.data,
    resumeSections: sections.data,
    aiAuditLog: auditLog.data,
    resumeExports: exports.data,
    rateLimit: rateLimit.data,
  });
}

async function removeStoragePrefix(client: SupabaseClient, bucket: string, prefix: string) {
  const files = await collectFiles(client, bucket, prefix);
  if (files.length) {
    const { error } = await client.storage.from(bucket).remove(files);
    if (error) throw new ApiError('INTERNAL_ERROR', error.message, 500);
  }
}

async function collectFiles(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
) {
  const paths: string[] = [];
  const walk = async (path: string) => {
    const { data, error } = await client.storage.from(bucket).list(path, { limit: 1000 });
    if (error) throw new ApiError('INTERNAL_ERROR', error.message, 500);
    for (const item of data ?? []) {
      const itemPath = `${path}/${item.name}`;
      if (item.metadata) paths.push(itemPath);
      else await walk(itemPath);
    }
  };
  await walk(prefix);
  return paths;
}
