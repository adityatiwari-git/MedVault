// Utility functions for managing user-specific data storage

async function createUserDocument(userId, documentData) {
  try {
    const document = await trickleCreateObject(`document:${userId}`, {
      UserID: userId,
      FileName: documentData.fileName,
      FileURL: documentData.fileUrl || '',
      Category: documentData.category,
      DateUploaded: new Date().toISOString(),
      AISummary: '',
      Notes: documentData.notes || '',
      HasFile: documentData.hasFile || false,
      FileType: documentData.fileType || '',
      FileSize: documentData.fileSize || 0
    });
    return document;
  } catch (error) {
    throw new Error('Failed to create document: ' + error.message);
  }
}

async function createUserPrescription(userId, prescriptionData) {
  try {
    const prescription = await trickleCreateObject(`prescription:${userId}`, {
      UserID: userId,
      MedicineName: prescriptionData.medicineName,
      Dosage: prescriptionData.dosage,
      Frequency: prescriptionData.frequency,
      ReminderEnabled: prescriptionData.reminderEnabled || false,
      StartDate: prescriptionData.startDate,
      EndDate: prescriptionData.endDate || '',
      Notes: prescriptionData.notes || ''
    });
    return prescription;
  } catch (error) {
    throw new Error('Failed to create prescription: ' + error.message);
  }
}

async function createCycleEntry(userId, cycleData) {
  try {
    const cycle = await trickleCreateObject(`cycle_tracking:${userId}`, {
      UserID: userId,
      PeriodStartDate: cycleData.startDate,
      PeriodEndDate: cycleData.endDate || '',
      Notes: cycleData.notes || '',
      AIPrediction: '',
      FlowIntensity: cycleData.flowIntensity || 'Medium',
      Symptoms: cycleData.symptoms || []
    });
    return cycle;
  } catch (error) {
    throw new Error('Failed to create cycle entry: ' + error.message);
  }
}

async function getUserDocuments(userId, limit = 50) {
  try {
    const result = await trickleListObjects(`document:${userId}`, limit, true);
    return result.items;
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return [];
  }
}

async function getUserPrescriptions(userId, limit = 50) {
  try {
    const result = await trickleListObjects(`prescription:${userId}`, limit, true);
    return result.items;
  } catch (error) {
    console.error('Error fetching user prescriptions:', error);
    return [];
  }
}

async function getUserCycles(userId, limit = 50) {
  try {
    const result = await trickleListObjects(`cycle_tracking:${userId}`, limit, true);
    return result.items;
  } catch (error) {
    console.error('Error fetching user cycles:', error);
    return [];
  }
}