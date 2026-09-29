// Authentication service boundary.
// Supabase Auth will replace the legacy Trickle implementation here.

export async function registerUser(userData) {
  throw new Error('Authentication backend is not configured yet.');
}

export async function loginUser(email, password) {
  throw new Error('Authentication backend is not configured yet.');
}

export async function getCurrentUser() {
  return null;
}

export async function logout() {
  return undefined;
}
