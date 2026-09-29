// Simple hash function for password (in production, use proper encryption)
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

async function registerUser(userData) {
  try {
    // Check if user already exists
    const existingUsers = await trickleListObjects('user', 100, false);
    const userExists = existingUsers.items.find(user => 
      user.objectData.Email === userData.email
    );

    if (userExists) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const hashedPassword = simpleHash(userData.password);
    const newUser = await trickleCreateObject('user', {
      Name: userData.name,
      Email: userData.email,
      Password: hashedPassword,
      Age: parseInt(userData.age),
      Gender: userData.gender
    });

    // Store user session
    localStorage.setItem('medvault_user', JSON.stringify(newUser));
    return newUser;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

async function loginUser(email, password) {
  try {
    const users = await trickleListObjects('user', 100, false);
    const user = users.items.find(u => 
      u.objectData.Email === email && 
      u.objectData.Password === simpleHash(password)
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Store user session
    localStorage.setItem('medvault_user', JSON.stringify(user));
    return user;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

function getCurrentUser() {
  try {
    const userData = localStorage.getItem('medvault_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
}

function logout() {
  localStorage.removeItem('medvault_user');
}