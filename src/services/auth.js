import { supabase } from '../lib/supabase.js';

const PROFILE_FIELDS = [
  'name',
  'age',
  'gender',
  'height_cm',
  'weight_kg',
  'blood_group',
  'allergies',
  'medical_conditions',
  'current_medications',
  'emergency_contact_name',
  'emergency_contact_phone',
];

function mapUser(user, profile = {}) {
  return {
    objectId: user.id,
    createdAt: user.created_at,
    objectData: {
      Name: profile.name ?? user.user_metadata?.name ?? '',
      Email: user.email ?? '',
      Age: profile.age ?? user.user_metadata?.age ?? '',
      Gender: profile.gender ?? user.user_metadata?.gender ?? 'female',
      HeightCm: profile.height_cm ?? '',
      WeightKg: profile.weight_kg ?? '',
      BloodGroup: profile.blood_group ?? '',
      Allergies: profile.allergies ?? '',
      MedicalConditions: profile.medical_conditions ?? '',
      CurrentMedications: profile.current_medications ?? '',
      EmergencyContactName: profile.emergency_contact_name ?? '',
      EmergencyContactPhone: profile.emergency_contact_phone ?? '',
    },
  };
}

async function loadProfile(user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS.join(', '))
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return mapUser(user, profile || {});
}

function validateSignup(data) {
  if (!data.name?.trim()) throw new Error('Please enter your name.');
  if (!data.email?.trim()) throw new Error('Please enter your email.');
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const age = Number(data.age);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    throw new Error('Please enter a valid age.');
  }
}

export async function registerUser(userData) {
  validateSignup(userData);

  const { data, error } = await supabase.auth.signUp({
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
    options: {
      data: {
        name: userData.name.trim(),
        age: Number(userData.age),
        gender: userData.gender || 'female',
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Account could not be created.');

  return {
    user: mapUser(data.user, userData),
    hasSession: Boolean(data.session),
  };
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return loadProfile(data.user);
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!data.session?.user) return null;

  return loadProfile(data.session.user);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw error;
}

export async function updateUserProfile(userId, profileData) {
  const update = {
    name: profileData.name.trim(),
    age: profileData.age ? Number(profileData.age) : null,
    gender: profileData.gender || 'female',
    height_cm: profileData.heightCm ? Number(profileData.heightCm) : null,
    weight_kg: profileData.weightKg ? Number(profileData.weightKg) : null,
    blood_group: profileData.bloodGroup || null,
    allergies: profileData.allergies?.trim() || null,
    medical_conditions: profileData.medicalConditions?.trim() || null,
    current_medications: profileData.currentMedications?.trim() || null,
    emergency_contact_name: profileData.emergencyContactName?.trim() || null,
    emergency_contact_phone: profileData.emergencyContactPhone?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(PROFILE_FIELDS.join(', '))
    .single();

  if (error) throw error;
  return data;
}
