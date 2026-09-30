const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const FILE_DB_NAME = 'medvault-local-files';
const FILE_STORE_NAME = 'files';

function makeId() {
  return crypto.randomUUID();
}

function listKey(type, userId) {
  return 'medvault_' + type + '_' + userId;
}

function readList(type, userId) {
  try {
    return JSON.parse(localStorage.getItem(listKey(type, userId)) || '[]');
  } catch {
    return [];
  }
}

function writeList(type, userId, items) {
  localStorage.setItem(listKey(type, userId), JSON.stringify(items));
}

function mapDocument(row, fileUrl = '') {
  return {
    objectId: row.id,
    objectData: {
      FileName: row.fileName,
      FileURL: fileUrl,
      StoragePath: row.storagePath,
      Category: row.category,
      DateUploaded: row.uploadedAt,
      AISummary: row.aiSummary || '',
      Notes: row.notes || '',
      HasFile: Boolean(row.hasFile),
      FileType: row.fileType || '',
      FileSize: row.fileSize || 0,
    },
  };
}

function mapPrescription(row) {
  return {
    objectId: row.id,
    objectData: {
      MedicineName: row.medicineName,
      Dosage: row.dosage,
      Frequency: row.frequency,
      ReminderEnabled: row.reminderEnabled,
      StartDate: row.startDate || '',
      EndDate: row.endDate || '',
      Notes: row.notes || '',
    },
  };
}

function mapCycle(row) {
  return {
    objectId: row.id,
    objectData: {
      PeriodStartDate: row.periodStartDate,
      PeriodEndDate: row.periodEndDate || '',
      Notes: row.notes || '',
      AIPrediction: row.aiPrediction || '',
      FlowIntensity: row.flowIntensity || '',
      Symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    },
  };
}

function validateFile(file) {
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 2MB in local mode.');
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type.');
  }
}

function openFileDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE_NAME)) {
        request.result.createObjectStore(FILE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Browser file storage is unavailable.'));
  });
}

async function saveFile(path, file) {
  const db = await openFileDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE_NAME, 'readwrite');
    transaction.objectStore(FILE_STORE_NAME).put(file, path);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Unable to save the file.'));
  });
  db.close();
}

async function getFile(path) {
  if (!path) return null;
  const db = await openFileDb();
  const file = await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(FILE_STORE_NAME).get(path);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Unable to read the file.'));
  });
  db.close();
  return file;
}

async function deleteFile(path) {
  if (!path) return;
  const db = await openFileDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE_NAME, 'readwrite');
    transaction.objectStore(FILE_STORE_NAME).delete(path);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Unable to delete the file.'));
  });
  db.close();
}

async function addFileUrl(document) {
  if (!document.hasFile || !document.storagePath) return mapDocument(document);
  const file = await getFile(document.storagePath);
  const url = file ? URL.createObjectURL(file) : '';
  return mapDocument(document, url);
}

export async function createUserDocument(userId, documentData) {
  validateFile(documentData.file);
  const id = makeId();
  const storagePath = documentData.file ? userId + '/' + id : '';
  if (documentData.file) await saveFile(storagePath, documentData.file);

  const document = {
    id,
    fileName: documentData.fileName.trim(),
    storagePath,
    category: documentData.category,
    uploadedAt: new Date().toISOString(),
    aiSummary: '',
    notes: documentData.notes?.trim() || '',
    hasFile: Boolean(documentData.file),
    fileType: documentData.file?.type || '',
    fileSize: documentData.file?.size || 0,
  };

  const documents = readList('documents', userId);
  documents.unshift(document);
  writeList('documents', userId, documents);
  return addFileUrl(document);
}

export async function updateUserDocument(userId, documentId, documentData) {
  validateFile(documentData.file);
  const documents = readList('documents', userId);
  const index = documents.findIndex((document) => document.id === documentId);
  if (index === -1) throw new Error('Document not found.');

  const current = documents[index];
  let updated = {
    ...current,
    fileName: documentData.fileName.trim(),
    category: documentData.category,
    notes: documentData.notes?.trim() || '',
  };

  if (documentData.file) {
    const newPath = userId + '/' + makeId();
    await saveFile(newPath, documentData.file);
    if (current.storagePath) await deleteFile(current.storagePath);
    updated = {
      ...updated,
      storagePath: newPath,
      hasFile: true,
      fileType: documentData.file.type,
      fileSize: documentData.file.size,
    };
  }

  documents[index] = updated;
  writeList('documents', userId, documents);
  return addFileUrl(updated);
}

export async function deleteUserDocument(userId, documentId) {
  const documents = readList('documents', userId);
  const document = documents.find((item) => item.id === documentId);
  if (!document) throw new Error('Document not found.');
  if (document.storagePath) await deleteFile(document.storagePath);
  writeList('documents', userId, documents.filter((item) => item.id !== documentId));
}

export async function getUserDocuments(userId, limit = 50) {
  const documents = readList('documents', userId)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, limit);
  return Promise.all(documents.map(addFileUrl));
}

export async function createUserPrescription(userId, data) {
  const prescription = {
    id: makeId(),
    medicineName: data.medicineName?.trim() || '',
    dosage: data.dosage?.trim() || '',
    frequency: data.frequency?.trim() || '',
    reminderEnabled: Boolean(data.reminderEnabled),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  const prescriptions = readList('prescriptions', userId);
  prescriptions.unshift(prescription);
  writeList('prescriptions', userId, prescriptions);
  return mapPrescription(prescription);
}

export async function getUserPrescriptions(userId, limit = 50) {
  return readList('prescriptions', userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(mapPrescription);
}

export async function updateUserPrescription(userId, prescriptionId, data) {
  const prescriptions = readList('prescriptions', userId);
  const index = prescriptions.findIndex((item) => item.id === prescriptionId);
  if (index === -1) throw new Error('Prescription not found.');
  prescriptions[index] = {
    ...prescriptions[index],
    medicineName: data.medicineName?.trim() || '',
    dosage: data.dosage?.trim() || '',
    frequency: data.frequency?.trim() || '',
    reminderEnabled: Boolean(data.reminderEnabled),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    notes: data.notes?.trim() || '',
  };
  writeList('prescriptions', userId, prescriptions);
  return mapPrescription(prescriptions[index]);
}

export async function deleteUserPrescription(userId, prescriptionId) {
  writeList('prescriptions', userId, readList('prescriptions', userId).filter((item) => item.id !== prescriptionId));
}

export async function createCycleEntry(userId, data) {
  const cycle = {
    id: makeId(),
    periodStartDate: data.periodStartDate,
    periodEndDate: data.periodEndDate || '',
    notes: data.notes?.trim() || '',
    aiPrediction: data.aiPrediction || '',
    flowIntensity: data.flowIntensity || '',
    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
    createdAt: new Date().toISOString(),
  };
  const cycles = readList('cycles', userId);
  cycles.unshift(cycle);
  writeList('cycles', userId, cycles);
  return mapCycle(cycle);
}

export async function getUserCycles(userId, limit = 50) {
  return readList('cycles', userId)
    .sort((a, b) => new Date(b.periodStartDate) - new Date(a.periodStartDate))
    .slice(0, limit)
    .map(mapCycle);
}

export async function updateCycleEntry(userId, cycleId, data) {
  const cycles = readList('cycles', userId);
  const index = cycles.findIndex((item) => item.id === cycleId);
  if (index === -1) throw new Error('Cycle entry not found.');
  cycles[index] = {
    ...cycles[index],
    periodStartDate: data.periodStartDate,
    periodEndDate: data.periodEndDate || '',
    notes: data.notes?.trim() || '',
    aiPrediction: data.aiPrediction || '',
    flowIntensity: data.flowIntensity || '',
    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
  };
  writeList('cycles', userId, cycles);
  return mapCycle(cycles[index]);
}

export async function deleteCycleEntry(userId, cycleId) {
  writeList('cycles', userId, readList('cycles', userId).filter((item) => item.id !== cycleId));
}
