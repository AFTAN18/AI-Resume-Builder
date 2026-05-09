import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { handleCors } from '../_shared/cors.ts';
import { ApiError, errorResponse, json } from '../_shared/envelope.ts';

interface SignupBody {
  fullName: string;
  email: string;
  password: string;
  consentAi: boolean;
  consentStorage: boolean;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();
    if (req.method !== 'POST' || path !== 'signup') {
      throw new ApiError('METHOD_NOT_ALLOWED', 'Use POST /functions/v1/auth/signup.', 405);
    }

    const body = (await req.json()) as SignupBody;
    validateSignup(body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    if (!supabaseUrl || !anonKey) {
      throw new ApiError('INTERNAL_ERROR', 'Supabase public credentials are not configured.', 500);
    }

    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await client.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          full_name: body.fullName,
          consent_ai: body.consentAi,
          consent_storage: body.consentStorage,
        },
      },
    });

    if (error) throw new ApiError('VALIDATION_FAILED', error.message, 400);

    return json({
      userId: data.user?.id,
      emailConfirmationRequired: !data.session,
    }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});

function validateSignup(body: SignupBody) {
  if (!body.fullName || body.fullName.trim().length < 2 || body.fullName.length > 100) {
    throw new ApiError('VALIDATION_FAILED', 'Full name must be between 2 and 100 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? '')) {
    throw new ApiError('VALIDATION_FAILED', 'A valid email is required.');
  }
  if (!body.consentAi || !body.consentStorage) {
    throw new ApiError('VALIDATION_FAILED', 'AI and storage consent are required.');
  }
  if (!isStrongPassword(body.password ?? '')) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Password must be at least 10 characters and include uppercase, number, and special character.',
    );
  }
}

function isStrongPassword(password: string) {
  return password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}
