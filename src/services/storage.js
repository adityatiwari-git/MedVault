// Application data service boundary.
// Supabase Database + Storage will replace the legacy Trickle implementation here.

export async function createUserDocument(userId, documentData) {
  throw new Error('Database backend is not configured yet.');
}

export async function createUserPrescription(userId, prescriptionData) {
  throw new Error('Database backend is not configured yet.');
}

export async function createCycleEntry(userId, cycleData) {
  throw new Error('Database backend is not configured yet.');
}

export async function getUserDocuments(userId, limit = 50) {
  return [];
}

export async function getUserPrescriptions(userId, limit = 50) {
  return [];
}

export async function getUserCycles(userId, limit = 50) {
  return [];
}
