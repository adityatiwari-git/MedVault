const USERS_KEY = 'medvault_local_users';
const SESSION_KEY = 'medvault_local_session';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function mapUser(user) {
  return {
    objectId: user.id,
    createdAt: user.createdAt,
    objectData: {
      Name: user.name,
      Email: user.email,
      Age: user.age,
      Gender: user.gender,
    },
  };
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
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

export async function registerUser(userData) {
  validateSignup(userData);

  const users = readUsers();
  const email = userData.email.trim().toLowerCase();

  if (users.some((user) => user.email === email)) {
    throw new Error('An account with this email already exists.');
  }

  const user = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: userData.name.trim(),
    email,
    age: Number(userData.age),
    gender: userData.gender || 'female',
    passwordHash: await hashPassword(userData.password),
  };

  users.push(user);
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, user.id);

  return {
    user: mapUser(user),
    hasSession: true,
  };
}

export async function loginUser(email, password) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user || user.passwordHash !== await hashPassword(password)) {
    throw new Error('Invalid email or password.');
  }

  localStorage.setItem(SESSION_KEY, user.id);
  return mapUser(user);
}

export async function getCurrentUser() {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return null;

  const user = readUsers().find((item) => item.id === sessionId);
  return user ? mapUser(user) : null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateUserProfile(userId, profileData) {
  const users = readUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new Error('Local account not found.');
  }

  users[userIndex] = {
    ...users[userIndex],
    name: profileData.name.trim(),
    age: Number(profileData.age),
    gender: profileData.gender,
  };

  saveUsers(users);
  return mapUser(users[userIndex]);
}
