import { supabase } from './lib/supabase.js';
import {
  getUserDocuments,
  getUserPrescriptions,
  getUserCycles,
  createUserDocument,
  updateUserDocument,
  createUserPrescription,
  createCycleEntry,
} from './services/storage.js';
import { loginUser, registerUser, logout, getCurrentUser } from './services/auth.js';
import {
  getEnhancedHealthAssistanceWithSearch,
  getHealthAssistance,
  getEnhancedHealthAssistance,
  generateDocumentSummary,
  generateCycleInsights,
} from './services/ai.js';

window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logout;
window.getCurrentUser = getCurrentUser;
window.getUserDocuments = getUserDocuments;
window.getUserPrescriptions = getUserPrescriptions;
window.getUserCycles = getUserCycles;
window.createUserDocument = async (userId, data) => {
  let file = data.file || null;

  if (!file && data.fileUrl && data.fileUrl.startsWith('data:')) {
    const response = await fetch(data.fileUrl);
    const blob = await response.blob();
    file = new File([blob], data.fileName || 'document', {
      type: data.fileType || blob.type || 'application/octet-stream',
    });
  }

  return createUserDocument(userId, { ...data, file });
};
window.createUserPrescription = createUserPrescription;
window.createCycleEntry = createCycleEntry;
window.getHealthAssistance = getHealthAssistance;
window.getEnhancedHealthAssistance = getEnhancedHealthAssistance;
window.getEnhancedHealthAssistanceWithSearch = getEnhancedHealthAssistanceWithSearch;
window.generateDocumentSummary = generateDocumentSummary;
window.generateCycleInsights = generateCycleInsights;

window.trickleListObjects = async (type, limit = 50) => {
  const user = await getCurrentUser();
  if (!user) return { items: [] };

  if (type.startsWith('document:')) return { items: await getUserDocuments(user.objectId, limit) };
  if (type.startsWith('prescription:')) return { items: await getUserPrescriptions(user.objectId, limit) };
  if (type.startsWith('cycle_tracking:')) return { items: await getUserCycles(user.objectId, limit) };
  return { items: [] };
};

window.trickleUpdateObject = async (type, id, data) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be logged in.');

  if (type.startsWith('document:')) {
    if (data.FileURL && data.FileURL.startsWith('data:')) {
      const response = await fetch(data.FileURL);
      const blob = await response.blob();
      const file = new File([blob], data.FileName || 'document', {
        type: data.FileType || blob.type || 'application/octet-stream',
      });
      return updateUserDocument(user.objectId, id, {
        fileName: data.FileName,
        category: data.Category,
        notes: data.Notes,
        file,
      });
    }

    const { data: row, error } = await supabase.from('documents').update({
      file_name: data.FileName,
      category: data.Category,
      notes: data.Notes || null,
      file_type: data.FileType,
      file_size: data.FileSize,
      has_file: data.HasFile,
    }).eq('id', id).eq('user_id', user.objectId).select().single();
    if (error) throw error;
    return row;
  }

  if (type === 'user') {
    const { error } = await supabase.from('profiles').update({
      name: data.Name,
      age: Number(data.Age),
      gender: data.Gender,
      updated_at: new Date().toISOString(),
    }).eq('id', user.objectId);
    if (error) throw error;
    return data;
  }

  if (type.startsWith('cycle_tracking:')) {
    const { data: row, error } = await supabase.from('cycle_entries').update({
      period_start_date: data.PeriodStartDate,
      period_end_date: data.PeriodEndDate || null,
      notes: data.Notes || null,
      ai_prediction: data.AIPrediction || null,
      flow_intensity: data.FlowIntensity || null,
      symptoms: Array.isArray(data.Symptoms) ? data.Symptoms.join(', ') : data.Symptoms || null,
    }).eq('id', id).eq('user_id', user.objectId).select().single();
    if (error) throw error;
    return row;
  }

  throw new Error('Unsupported update operation.');
};

window.trickleDeleteObject = async (type, id) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be logged in.');

  const table = type.startsWith('document:') ? 'documents'
    : type.startsWith('cycle_tracking:') ? 'cycle_entries'
    : null;

  if (!table) throw new Error('Unsupported delete operation.');

  const { error } = await supabase.from(table)
    .delete().eq('id', id).eq('user_id', user.objectId);

  if (error) throw error;
};
