import { supabase } from '../lib/supabase.js';

const BUCKET = 'medical-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function mapDocument(row, signedUrl = '') {
  return {
    objectId: row.id,
    objectData: {
      FileName: row.file_name,
      FileURL: signedUrl,
      StoragePath: row.storage_path,
      Category: row.category,
      DateUploaded: row.uploaded_at,
      AISummary: row.ai_summary,
      Notes: row.notes,
      HasFile: row.has_file,
      FileType: row.file_type,
      FileSize: row.file_size,
    },
  };
}

function mapPrescription(row) {
  return {
    objectId: row.id,
    objectData: {
      MedicineName: row.medicine_name,
      Dosage: row.dosage,
      Frequency: row.frequency,
      ReminderEnabled: row.reminder_enabled,
      StartDate: row.start_date,
      EndDate: row.end_date,
      Notes: row.notes,
    },
  };
}

function mapCycle(row) {
  return {
    objectId: row.id,
    objectData: {
      PeriodStartDate: row.period_start_date,
      PeriodEndDate: row.period_end_date,
      Notes: row.notes,
      AIPrediction: row.ai_prediction,
      FlowIntensity: row.flow_intensity,
      Symptoms: row.symptoms ? row.symptoms.split(', ').filter(Boolean) : [],
    },
  };
}

async function getSignedUrl(path) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data?.signedUrl || '';
}

function validateFile(file) {
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) throw new Error('File size must be less than 10MB.');
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.type)) throw new Error('Unsupported file type.');
}

function buildStoragePath(userId, file) {
  return userId + '/' + crypto.randomUUID() + '-' + file.name;
}

export async function createUserDocument(userId, documentData) {
  validateFile(documentData.file);
  let storagePath = '';

  if (documentData.file) {
    storagePath = buildStoragePath(userId, documentData.file);
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, documentData.file, {
      contentType: documentData.file.type,
      upsert: false,
    });
    if (error) throw error;
  }

  const { data, error } = await supabase.from('documents').insert({
    user_id: userId,
    file_name: documentData.fileName,
    storage_path: storagePath || null,
    category: documentData.category,
    notes: documentData.notes || null,
    has_file: Boolean(documentData.file),
    file_type: documentData.file?.type || null,
    file_size: documentData.file?.size || null,
  }).select().single();

  if (error) {
    if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }

  return mapDocument(data, await getSignedUrl(storagePath));
}

export async function updateUserDocument(userId, documentId, documentData) {
  validateFile(documentData.file);

  const { data: existing, error: existingError } = await supabase
    .from('documents').select('*').eq('id', documentId).eq('user_id', userId).single();

  if (existingError) throw existingError;

  let storagePath = existing.storage_path;
  let fileType = existing.file_type;
  let fileSize = existing.file_size;
  let hasFile = existing.has_file;
  let newStoragePath = '';

  if (documentData.file) {
    newStoragePath = buildStoragePath(userId, documentData.file);
    const { error } = await supabase.storage.from(BUCKET).upload(newStoragePath, documentData.file, {
      contentType: documentData.file.type,
      upsert: false,
    });
    if (error) throw error;

    storagePath = newStoragePath;
    fileType = documentData.file.type;
    fileSize = documentData.file.size;
    hasFile = true;
  }

  const { data, error } = await supabase.from('documents').update({
    file_name: documentData.fileName,
    category: documentData.category,
    notes: documentData.notes || null,
    storage_path: storagePath || null,
    file_type: fileType,
    file_size: fileSize,
    has_file: hasFile,
  }).eq('id', documentId).eq('user_id', userId).select().single();

  if (error) {
    if (newStoragePath) await supabase.storage.from(BUCKET).remove([newStoragePath]);
    throw error;
  }

  if (newStoragePath && existing.storage_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([existing.storage_path]);
    if (removeError) console.warn('Old file cleanup failed:', removeError.message);
  }

  return mapDocument(data, await getSignedUrl(storagePath));
}

export async function deleteUserDocument(userId, documentId) {
  const { data: existing, error: fetchError } = await supabase
    .from('documents').select('storage_path').eq('id', documentId).eq('user_id', userId).single();

  if (fetchError) throw fetchError;

  const { error } = await supabase.from('documents')
    .delete().eq('id', documentId).eq('user_id', userId);

  if (error) throw error;

  if (existing.storage_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([existing.storage_path]);
    if (removeError) console.warn('File cleanup failed:', removeError.message);
  }
}

export async function createUserPrescription(userId, prescriptionData) {
  const { data, error } = await supabase.from('prescriptions').insert({
    user_id: userId,
    medicine_name: prescriptionData.medicineName,
    dosage: prescriptionData.dosage,
    frequency: prescriptionData.frequency,
    reminder_enabled: Boolean(prescriptionData.reminderEnabled),
    start_date: prescriptionData.startDate || null,
    end_date: prescriptionData.endDate || null,
    notes: prescriptionData.notes || null,
  }).select().single();

  if (error) throw error;
  return mapPrescription(data);
}

export async function createCycleEntry(userId, cycleData) {
  const { data, error } = await supabase.from('cycle_entries').insert({
    user_id: userId,
    period_start_date: cycleData.periodStartDate,
    period_end_date: cycleData.periodEndDate || null,
    notes: cycleData.notes || null,
    ai_prediction: cycleData.aiPrediction || null,
    flow_intensity: cycleData.flowIntensity || null,
    symptoms: Array.isArray(cycleData.symptoms)
      ? cycleData.symptoms.join(', ')
      : cycleData.symptoms || null,
  }).select().single();

  if (error) throw error;
  return mapCycle(data);
}

export async function getUserDocuments(userId, limit = 50) {
  const { data, error } = await supabase.from('documents').select('*')
    .eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(limit);

  if (error) throw error;
  return Promise.all((data || []).map(async (row) => (
    mapDocument(row, await getSignedUrl(row.storage_path))
  )));
}

export async function getUserPrescriptions(userId, limit = 50) {
  const { data, error } = await supabase.from('prescriptions').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);

  if (error) throw error;
  return (data || []).map(mapPrescription);
}

export async function getUserCycles(userId, limit = 50) {
  const { data, error } = await supabase.from('cycle_entries').select('*')
    .eq('user_id', userId).order('period_start_date', { ascending: false }).limit(limit);

  if (error) throw error;
  return (data || []).map(mapCycle);
}

export async function updateUserPrescription(userId, prescriptionId, prescriptionData) {
  const { data, error } = await supabase.from('prescriptions').update({
    medicine_name: prescriptionData.medicineName,
    dosage: prescriptionData.dosage,
    frequency: prescriptionData.frequency,
    reminder_enabled: Boolean(prescriptionData.reminderEnabled),
    start_date: prescriptionData.startDate || null,
    end_date: prescriptionData.endDate || null,
    notes: prescriptionData.notes || null,
  }).eq('id', prescriptionId).eq('user_id', userId).select().single();

  if (error) throw error;
  return mapPrescription(data);
}

export async function deleteUserPrescription(userId, prescriptionId) {
  const { error } = await supabase.from('prescriptions')
    .delete().eq('id', prescriptionId).eq('user_id', userId);

  if (error) throw error;
}

export async function updateCycleEntry(userId, cycleId, cycleData) {
  const { data, error } = await supabase.from('cycle_entries').update({
    period_start_date: cycleData.periodStartDate,
    period_end_date: cycleData.periodEndDate || null,
    notes: cycleData.notes || null,
    ai_prediction: cycleData.aiPrediction || null,
    flow_intensity: cycleData.flowIntensity || null,
    symptoms: Array.isArray(cycleData.symptoms)
      ? cycleData.symptoms.join(', ')
      : cycleData.symptoms || null,
  }).eq('id', cycleId).eq('user_id', userId).select().single();

  if (error) throw error;
  return mapCycle(data);
}

export async function deleteCycleEntry(userId, cycleId) {
  const { error } = await supabase.from('cycle_entries')
    .delete().eq('id', cycleId).eq('user_id', userId);

  if (error) throw error;
}
