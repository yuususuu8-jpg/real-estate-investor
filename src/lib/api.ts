import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiError(error: unknown): Promise<never> {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ApiError(error.message);
  }

  throw new ApiError('An unknown error occurred');
}

export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new ApiError(error.message, error.name);
  }

  if (!user) {
    throw new ApiError('User not authenticated', 'NOT_AUTHENTICATED');
  }

  return user;
}

export async function checkAuthentication(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
