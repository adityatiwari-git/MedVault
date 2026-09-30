const USERS_KEY = 'medvault_users';
const SESSION_KEY = 'medvault_session';

const PROFILE_FIELDS = [
  'name',
  'age',
  'gender',
  'heightCm',
  'weightKg',
  'bloodGroup',
  'allergies',
  'medicalConditions',
  'currentMedications',
  'emergencyContactName',
  'emergencyContactPhone',
];

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function mapUser(user) {
  return {
    objectId: user.id,
    createdAt: user.createdAt,
    objectData: {
      Name: user.name || '',
      Email: user.email || '',
      Age: user.age || '',
      Gender: user.gender || 'female',
      HeightCm: user.heightCm || '',
      WeightKg: user.weightKg || '',
      BloodGroup: user.bloodGroup || '',
      Allergies: user.allergies || '',
      MedicalConditions: user.medicalConditions || '',
      CurrentMedications: user.currentMedications || '',
      EmergencyContactName: user.emergencyContactName || '',
      EmergencyContactPhone: user.emergencyContactPhone || '',
    },
  };
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
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

function buildUser(data, passwordHash) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    passwordHash,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    age: Number(data.age),
    gender: data.gender || 'female',
    heightCm: '',
    weightKg: '',
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  };
}

export async function registerUser(userData) {
  validateSignup(userData);

  const email = userData.email.trim().toLowerCase();
  const users = readUsers();

  if (users[email]) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const passwordHash = await hashPassword(userData.password);
  const user = buildUser(userData, passwordHash);

  users[email] = user;
  writeUsers(users);
  localStorage.setItem(SESSION_KEY, user.id);

  return {
    user: mapUser(user),
    hasSession: true,
  };
}

export async function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const user = users[normalizedEmail];

  if (!user) {
    throw new Error('No local account was found for this email.');
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error('Incorrect email or password.');
  }

  localStorage.setItem(SESSION_KEY, user.id);
  return mapUser(user);
}

export async function getCurrentUser() {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return null;

  const users = readUsers();
  const user = Object.values(users).find((item) => item.id === sessionId);

  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return mapUser(user);
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function updateUserProfile(userId, profileData) {
  const users = readUsers();
  const email = Object.keys(users).find((key) => users[key].id === userId);

  if (!email) throw new Error('Your local account could not be found.');

  const user = users[email];
  const update = {
    ...user,
    name: profileData.name.trim(),
    age: profileData.age ? Number(profileData.age) : '',
    gender: profileData.gender || 'female',
    heightCm: profileData.heightCm ? Number(profileData.heightCm) : '',
    weightKg: profileData.weightKg ? Number(profileData.weightKg) : '',
    bloodGroup: profileData.bloodGroup || '',
    allergies: profileData.allergies?.trim() || '',
    medicalConditions: profileData.medicalConditions?.trim() || '',
    currentMedications: profileData.currentMedications?.trim() || '',
    emergencyContactName: profileData.emergencyContactName?.trim() || '',
    emergencyContactPhone: profileData.emergencyContactPhone?.trim() || '',
    updatedAt: new Date().toISOString(),
  };

  users[email] = update;
  writeUsers(users);

  return {
    name: update.name,
    age: update.age,
    gender: update.gender,
    height_cm: update.heightCm,
    weight_kg: update.weightKg,
    blood_group: update.bloodGroup,
    allergies: update.allergies,
    medical_conditions: update.medicalConditions,
    current_medications: update.currentMedications,
    emergency_contact_name: update.emergencyContactName,
    emergency_contact_phone: update.emergencyContactPhone,
  };
}

// Kept as a compatibility helper for older UI code.
// Browser-local accounts cannot send email reset links.
export async function resetPassword() {
  throw new Error('Password reset email is not available in browser-only mode. Use the account on the same browser where it was created.');
}
