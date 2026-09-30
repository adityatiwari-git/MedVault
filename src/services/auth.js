import { supabase } from '../lib/supabase.js';

function mapUser(user, profile = {}) {
  return {
    objectId: user.id,
    createdAt: user.created_at,
    objectData: {
      Name: profile.name ?? user.user_metadata?.name ?? '',
      Email: user.email ?? '',
      Age: profile.age ?? user.user_metadata?.age ?? '',
      Gender: profile.gender ?? user.user_metadata?.gender ?? '',
    },
  };
}

async function loadProfile(user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, age, gender')
    .eq('id', user.id)
    .maybeSingle();

  return mapUser(user, profile || {});
}

export async function registerUser(userData) {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
        age: userData.age ? Number(userData.age) : null,
        gender: userData.gender,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Account could not be created.');

  return data.session
    ? loadProfile(data.user)
    : mapUser(data.user, userData);
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return loadProfile(data.user);
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return loadProfile(data.session.user);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateUserProfile(userId, profileData) {
  const { data, error } = await supabase.from('profiles').update({
    name: profileData.name,
    age: Number(profileData.age),
    gender: profileData.gender,
    updated_at: new Date().toISOString(),
  }).eq('id', userId).select('name, age, gender').single();

  if (error) throw error;
  return data;
}
