const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DB_NAME = 'medvault-files';
const DB_VERSION = 1;
const FILE_STORE = 'files';

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

function writeList(type, userId, value) {
  localStorage.setItem(listKey(type, userId), JSON.stringify(value));
}

function createId() {
  return crypto.randomUUID();
}

function openFileDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local file storage.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_STORE)) {
        database.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local file storage.'));
  });
}

async function saveFile(id, file) {
  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readwrite');
    transaction.objectStore(FILE_STORE).put({
      id,
      blob: file,
      name: file.name,
      type: file.type,
    });

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Unable to save the file locally.'));
    };
  });
}

async function getFile(id) {
  if (!id) return null;

  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readonly');
    const request = transaction.objectStore(FILE_STORE).get(id);

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error || new Error('Unable to read the local file.'));
    };
  });
}

async function removeFile(id) {
  if (!id) return;

  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, 'readwrite');
    transaction.objectStore(FILE_STORE).delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Unable to remove the local file.'));
    };
  });
}

function validateFile(file) {
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be 10 MB or smaller.');
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please choose a JPG, PNG, GIF, PDF, TXT, DOC, or DOCX file.');
  }
}

async function mapDocument(row) {
  let fileUrl = '';

  if (row.storageKey) {
    const storedFile = await getFile(row.storageKey);
    if (storedFile?.blob) {
      fileUrl = URL.createObjectURL(storedFile.blob);
    }
  }

  return {
    objectId: row.id,
    objectData: {
      FileName: row.fileName,
      FileURL: fileUrl,
      StoragePath: row.storageKey,
      Category: row.category,
      DateUploaded: row.uploadedAt,
      Notes: row.notes,
      HasFile: row.hasFile,
      FileType: row.fileType,
      FileSize: row.fileSize,
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
      StartDate: row.startDate,
      EndDate: row.endDate,
      Notes: row.notes,
    },
  };
}

function mapCycle(row) {
  return {
    objectId: row.id,
    objectData: {
      PeriodStartDate: row.periodStartDate,
      PeriodEndDate: row.periodEndDate,
      Notes: row.notes,
      AIPrediction: row.aiPrediction || null,
      FlowIntensity: row.flowIntensity,
      Symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    },
  };
}

export async function createUserDocument(userId, documentData) {
  validateFile(documentData.file);

  const id = createId();
  const storageKey = documentData.file ? userId + '/' + id : '';
  const uploadedAt = new Date().toISOString();

  if (documentData.file) {
    await saveFile(storageKey, documentData.file);
  }

  const documents = readList('documents', userId);
  documents.push({
    id,
    fileName: documentData.fileName.trim(),
    storageKey: storageKey || null,
    category: documentData.category,
    uploadedAt,
    notes: documentData.notes?.trim() || '',
    hasFile: Boolean(documentData.file),
    fileType: documentData.file?.type || '',
    fileSize: documentData.file?.size || 0,
  });

  try {
    writeList('documents', userId, documents);
  } catch (error) {
    if (storageKey) await removeFile(storageKey);
    throw error;
  }

  return mapDocument(documents[documents.length - 1]);
}

export async function updateUserDocument(userId, documentId, documentData) {
  validateFile(documentData.file);

  const documents = readList('documents', userId);
  const index = documents.findIndex((item) => item.id === documentId);

  if (index === -1) throw new Error('The health record could not be found.');

  const existing = documents[index];
  let nextStorageKey = existing.storageKey;

  if (documentData.file) {
    nextStorageKey = userId + '/' + documentId + '-' + createId();
    await saveFile(nextStorageKey, documentData.file);

    if (existing.storageKey) {
      await removeFile(existing.storageKey);
    }
  }

  documents[index] = {
    ...existing,
    fileName: documentData.fileName.trim(),
    category: documentData.category,
    notes: documentData.notes?.trim() || '',
    storageKey: nextStorageKey || null,
    hasFile: Boolean(nextStorageKey),
    fileType: documentData.file ? documentData.file.type : existing.fileType,
    fileSize: documentData.file ? documentData.file.size : existing.fileSize,
  };

  writeList('documents', userId, documents);
  return mapDocument(documents[index]);
}

export async function deleteUserDocument(userId, documentId) {
  const documents = readList('documents', userId);
  const existing = documents.find((item) => item.id === documentId);

  if (!existing) throw new Error('The health record could not be found.');

  const remaining = documents.filter((item) => item.id !== documentId);
  writeList('documents', userId, remaining);

  if (existing.storageKey) {
    await removeFile(existing.storageKey);
  }
}

export async function createUserPrescription(userId, prescriptionData) {
  const record = {
    id: createId(),
    medicineName: prescriptionData.medicineName.trim(),
    dosage: prescriptionData.dosage?.trim() || '',
    frequency: prescriptionData.frequency?.trim() || '',
    reminderEnabled: Boolean(prescriptionData.reminderEnabled),
    startDate: prescriptionData.startDate || '',
    endDate: prescriptionData.endDate || '',
    notes: prescriptionData.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  const prescriptions = readList('prescriptions', userId);
  prescriptions.unshift(record);
  writeList('prescriptions', userId, prescriptions);

  return mapPrescription(record);
}

export async function getUserDocuments(userId, limit = 50) {
  const documents = readList('documents', userId)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, limit);

  return Promise.all(documents.map(mapDocument));
}

export async function getUserPrescriptions(userId, limit = 50) {
  return readList('prescriptions', userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(mapPrescription);
}

export async function getUserCycles(userId, limit = 50) {
  return readList('cycles', userId)
    .sort((a, b) => new Date(b.periodStartDate) - new Date(a.periodStartDate))
    .slice(0, limit)
    .map(mapCycle);
}

export async function updateUserPrescription(userId, prescriptionId, prescriptionData) {
  const prescriptions = readList('prescriptions', userId);
  const index = prescriptions.findIndex((item) => item.id === prescriptionId);

  if (index === -1) throw new Error('The prescription could not be found.');

  prescriptions[index] = {
    ...prescriptions[index],
    medicineName: prescriptionData.medicineName.trim(),
    dosage: prescriptionData.dosage?.trim() || '',
    frequency: prescriptionData.frequency?.trim() || '',
    reminderEnabled: Boolean(prescriptionData.reminderEnabled),
    startDate: prescriptionData.startDate || '',
    endDate: prescriptionData.endDate || '',
    notes: prescriptionData.notes?.trim() || '',
    updatedAt: new Date().toISOString(),
  };

  writeList('prescriptions', userId, prescriptions);
  return mapPrescription(prescriptions[index]);
}

export async function deleteUserPrescription(userId, prescriptionId) {
  const prescriptions = readList('prescriptions', userId);
  const remaining = prescriptions.filter((item) => item.id !== prescriptionId);

  if (remaining.length === prescriptions.length) {
    throw new Error('The prescription could not be found.');
  }

  writeList('prescriptions', userId, remaining);
}

export async function createCycleEntry(userId, cycleData) {
  const record = {
    id: createId(),
    periodStartDate: cycleData.periodStartDate,
    periodEndDate: cycleData.periodEndDate || '',
    notes: cycleData.notes?.trim() || '',
    aiPrediction: cycleData.aiPrediction || null,
    flowIntensity: cycleData.flowIntensity || '',
    symptoms: Array.isArray(cycleData.symptoms) ? cycleData.symptoms : [],
    createdAt: new Date().toISOString(),
  };

  const cycles = readList('cycles', userId);
  cycles.push(record);
  writeList('cycles', userId, cycles);

  return mapCycle(record);
}

export async function updateCycleEntry(userId, cycleId, cycleData) {
  const cycles = readList('cycles', userId);
  const index = cycles.findIndex((item) => item.id === cycleId);

  if (index === -1) throw new Error('The cycle entry could not be found.');

  cycles[index] = {
    ...cycles[index],
    periodStartDate: cycleData.periodStartDate,
    periodEndDate: cycleData.periodEndDate || '',
    notes: cycleData.notes?.trim() || '',
    aiPrediction: cycleData.aiPrediction || null,
    flowIntensity: cycleData.flowIntensity || '',
    symptoms: Array.isArray(cycleData.symptoms) ? cycleData.symptoms : [],
    updatedAt: new Date().toISOString(),
  };

  writeList('cycles', userId, cycles);
  return mapCycle(cycles[index]);
}

export async function deleteCycleEntry(userId, cycleId) {
  const cycles = readList('cycles', userId);
  const remaining = cycles.filter((item) => item.id !== cycleId);

  if (remaining.length === cycles.length) {
    throw new Error('The cycle entry could not be found.');
  }

  writeList('cycles', userId, remaining);
}
