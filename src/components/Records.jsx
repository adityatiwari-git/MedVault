import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  Eye,
  FileHeart,
  FileText,
  Filter,
  FolderOpen,
  Pill,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createUserDocument,
  createUserPrescription,
  deleteUserDocument,
  deleteUserPrescription,
  getUserDocuments,
  getUserPrescriptions,
  updateUserDocument,
  updateUserPrescription,
} from '../services/storage.js';

const categories = ['All', 'Prescription', 'Lab Report', 'Scan', 'Menstrual', 'General Health'];

const emptyDocument = {
  fileName: '',
  category: 'General Health',
  notes: '',
  file: null,
};

const emptyPrescription = {
  medicineName: '',
  dosage: '',
  frequency: '',
  reminderEnabled: false,
  startDate: '',
  endDate: '',
  notes: '',
};

function Records({ user }) {
  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [documentForm, setDocumentForm] = useState(emptyDocument);
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [documentData, prescriptionData] = await Promise.all([
        getUserDocuments(user.objectId),
        getUserPrescriptions(user.objectId),
      ]);
      setDocuments(documentData);
      setPrescriptions(prescriptionData);
    } catch (err) {
      setError(err.message || 'Unable to load your health records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.objectId]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const item = document.objectData;
      const matchesSearch =
        !query ||
        item.FileName?.toLowerCase().includes(query) ||
        item.Category?.toLowerCase().includes(query) ||
        item.Notes?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'All' || item.Category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [documents, search, selectedCategory]);

  const resetDocument = () => {
    setDocumentForm(emptyDocument);
    setEditingDocument(null);
    setShowDocumentForm(false);
  };

  const resetPrescription = () => {
    setPrescriptionForm(emptyPrescription);
    setEditingPrescription(null);
    setShowPrescriptionForm(false);
  };

  const chooseFile = (file) => {
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > 10 * 1024 * 1024) {
      setError('The file must be 10 MB or smaller.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, GIF, PDF, TXT, DOC, or DOCX file.');
      return;
    }

    setError('');
    setDocumentForm((current) => ({
      ...current,
      file,
      fileName: current.fileName || file.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const saveDocument = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (!documentForm.fileName.trim()) throw new Error('Please enter a document name.');

      if (editingDocument) {
        await updateUserDocument(user.objectId, editingDocument.objectId, documentForm);
      } else {
        await createUserDocument(user.objectId, documentForm);
      }

      resetDocument();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save the document.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePrescription = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (!prescriptionForm.medicineName.trim()) throw new Error('Please enter a medicine name.');

      if (editingPrescription) {
        await updateUserPrescription(
          user.objectId,
          editingPrescription.objectId,
          prescriptionForm,
        );
      } else {
        await createUserPrescription(user.objectId, prescriptionForm);
      }

      resetPrescription();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save the prescription.');
    } finally {
      setIsSaving(false);
    }
  };

  const editDocument = (document) => {
    setEditingDocument(document);
    setDocumentForm({
      fileName: document.objectData.FileName || '',
      category: document.objectData.Category || 'General Health',
      notes: document.objectData.Notes || '',
      file: null,
    });
    setShowDocumentForm(true);
  };

  const editPrescription = (prescription) => {
    const item = prescription.objectData;
    setEditingPrescription(prescription);
    setPrescriptionForm({
      medicineName: item.MedicineName || '',
      dosage: item.Dosage || '',
      frequency: item.Frequency || '',
      reminderEnabled: Boolean(item.ReminderEnabled),
      startDate: item.StartDate || '',
      endDate: item.EndDate || '',
      notes: item.Notes || '',
    });
    setShowPrescriptionForm(true);
  };

  const removeDocument = async (id) => {
    if (!window.confirm('Delete this health record?')) return;
    try {
      await deleteUserDocument(user.objectId, id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to delete the record.');
    }
  };

  const removePrescription = async (id) => {
    if (!window.confirm('Delete this prescription record?')) return;
    try {
      await deleteUserPrescription(user.objectId, id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to delete the prescription.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-28 rounded-3xl bg-white/70" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-56 rounded-3xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <p className="eyebrow">Your health library</p>
          <h1 className="page-title">Health Records</h1>
          <p className="page-subtitle">
            Store important reports and prescription details together so they are easy to find later.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-light" onClick={() => setShowPrescriptionForm(true)}>
            <Pill size={18} />
            Add prescription
          </button>
          <button className="btn btn-primary" onClick={() => setShowDocumentForm(true)}>
            <Upload size={18} />
            Upload document
          </button>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="surface-card p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={'section-tab ' + (activeSection === 'documents' ? 'section-tab-active' : '')}
            onClick={() => setActiveSection('documents')}
          >
            <FileHeart size={18} />
            Documents
            <span className="tab-count">{documents.length}</span>
          </button>

          <button
            className={'section-tab ' + (activeSection === 'prescriptions' ? 'section-tab-active' : '')}
            onClick={() => setActiveSection('prescriptions')}
          >
            <Pill size={18} />
            Prescriptions
            <span className="tab-count">{prescriptions.length}</span>
          </button>
        </div>
      </section>

      {activeSection === 'documents' ? (
        <>
          <section className="surface-card">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="input-wrap">
                <Search size={18} />
                <input
                  className="input-control"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your records"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter size={17} className="shrink-0 text-slate-400" />
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={'filter-chip ' + (selectedCategory === category ? 'filter-chip-active' : '')}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => {
              const item = document.objectData;
              const isImage = item.FileType?.startsWith('image/');
              const isPdf = item.FileType === 'application/pdf';

              return (
                <article key={document.objectId} className="surface-card overflow-hidden p-0">
                  <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                    {isImage && item.FileURL ? (
                      <img src={item.FileURL} alt={item.FileName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="record-preview-icon">
                        {isPdf ? <FileText size={38} /> : <FolderOpen size={38} />}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-800">{item.FileName}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="tag tag-purple">{item.Category}</span>
                          <span className="tag tag-gray">
                            {new Date(item.DateUploaded).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <FileHeart size={20} className="shrink-0 text-purple-400" />
                    </div>

                    {item.Notes && (
                      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-500">
                        {item.Notes}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {item.FileURL && (
                        <button className="action-button" onClick={() => setViewingFile({
                          name: item.FileName,
                          url: item.FileURL,
                          type: item.FileType || '',
                          size: item.FileSize || 0,
                        })}>
                          <Eye size={16} /> View
                        </button>
                      )}
                      <button className="action-button" onClick={() => editDocument(document)}>
                        <Edit3 size={16} /> Edit
                      </button>
                      <button className="action-button danger" onClick={() => removeDocument(document.objectId)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {filteredDocuments.length === 0 && (
            <div className="surface-card">
              <div className="empty-state">
                <FolderOpen size={40} />
                <p className="font-bold text-slate-700">No documents found</p>
                <p className="text-sm text-slate-400">
                  Upload a report, scan, prescription, or another health document.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {prescriptions.map((prescription) => {
            const item = prescription.objectData;

            return (
              <article key={prescription.objectId} className="surface-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="med-icon-large"><Pill size={21} /></div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-800">{item.MedicineName}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.Dosage || 'Dosage not added'}</p>
                    </div>
                  </div>
                  {item.ReminderEnabled && <span className="tag tag-green">Reminder on</span>}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Frequency</p>
                    <p className="mt-1 font-semibold text-slate-700">{item.Frequency || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Start date</p>
                    <p className="mt-1 font-semibold text-slate-700">{item.StartDate || '—'}</p>
                  </div>
                </div>

                {item.Notes && (
                  <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                    {item.Notes}
                  </p>
                )}

                <div className="mt-5 flex gap-2">
                  <button className="action-button flex-1" onClick={() => editPrescription(prescription)}>
                    <Edit3 size={16} /> Edit
                  </button>
                  <button className="action-button danger flex-1" onClick={() => removePrescription(prescription.objectId)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </article>
            );
          })}

          {prescriptions.length === 0 && (
            <div className="surface-card md:col-span-2 xl:col-span-3">
              <div className="empty-state">
                <Pill size={40} />
                <p className="font-bold text-slate-700">No prescriptions saved yet</p>
                <p className="text-sm text-slate-400">
                  Keep medicine, dosage, dates, reminders, and notes together.
                </p>
                <button className="btn btn-primary mt-2" onClick={() => setShowPrescriptionForm(true)}>
                  <Plus size={18} /> Add prescription
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {showDocumentForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingDocument ? 'Edit record' : 'New record'}</p>
                <h2 className="modal-title">{editingDocument ? 'Update document' : 'Upload new document'}</h2>
              </div>
              <button className="icon-button" onClick={resetDocument} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveDocument} className="space-y-4">
              <input
                className="input-control input-control-full"
                placeholder="Document name"
                value={documentForm.fileName}
                onChange={(event) => setDocumentForm({ ...documentForm, fileName: event.target.value })}
                required
              />

              <button
                type="button"
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={28} />
                <span className="mt-2 font-semibold text-slate-700">
                  {documentForm.file ? documentForm.file.name : 'Choose a file'}
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  JPG, PNG, GIF, PDF, TXT, DOC or DOCX · max 10 MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
              </button>

              <select
                className="input-control input-control-full"
                value={documentForm.category}
                onChange={(event) => setDocumentForm({ ...documentForm, category: event.target.value })}
              >
                {categories.slice(1).map((category) => <option key={category}>{category}</option>)}
              </select>

              <textarea
                className="input-control input-control-full min-h-24 resize-none"
                placeholder="Notes (optional)"
                value={documentForm.notes}
                onChange={(event) => setDocumentForm({ ...documentForm, notes: event.target.value })}
              />

              <div className="flex gap-3">
                <button type="button" className="btn btn-light flex-1" onClick={resetDocument}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingDocument ? 'Save changes' : 'Save document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrescriptionForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingPrescription ? 'Edit prescription' : 'New prescription'}</p>
                <h2 className="modal-title">{editingPrescription ? 'Update medicine details' : 'Save a prescription'}</h2>
              </div>
              <button className="icon-button" onClick={resetPrescription} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={savePrescription} className="space-y-4">
              <input
                className="input-control input-control-full"
                placeholder="Medicine name"
                value={prescriptionForm.medicineName}
                onChange={(event) => setPrescriptionForm({ ...prescriptionForm, medicineName: event.target.value })}
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-control input-control-full"
                  placeholder="Dosage"
                  value={prescriptionForm.dosage}
                  onChange={(event) => setPrescriptionForm({ ...prescriptionForm, dosage: event.target.value })}
                />
                <input
                  className="input-control input-control-full"
                  placeholder="Frequency"
                  value={prescriptionForm.frequency}
                  onChange={(event) => setPrescriptionForm({ ...prescriptionForm, frequency: event.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field-label">
                  Start date
                  <input
                    type="date"
                    className="input-control input-control-full mt-1"
                    value={prescriptionForm.startDate}
                    onChange={(event) => setPrescriptionForm({ ...prescriptionForm, startDate: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  End date
                  <input
                    type="date"
                    className="input-control input-control-full mt-1"
                    value={prescriptionForm.endDate}
                    onChange={(event) => setPrescriptionForm({ ...prescriptionForm, endDate: event.target.value })}
                  />
                </label>
              </div>

              <label className="toggle-row">
                <span>
                  <span className="font-semibold text-slate-700">Medication reminder</span>
                  <span className="block text-xs text-slate-400">Show this medicine in active reminders.</span>
                </span>
                <input
                  type="checkbox"
                  checked={prescriptionForm.reminderEnabled}
                  onChange={(event) => setPrescriptionForm({ ...prescriptionForm, reminderEnabled: event.target.checked })}
                />
              </label>

              <textarea
                className="input-control input-control-full min-h-24 resize-none"
                placeholder="Notes (optional)"
                value={prescriptionForm.notes}
                onChange={(event) => setPrescriptionForm({ ...prescriptionForm, notes: event.target.value })}
              />

              <div className="flex gap-3">
                <button type="button" className="btn btn-light flex-1" onClick={resetPrescription}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingPrescription ? 'Save changes' : 'Save prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingFile && (
        <div className="modal-backdrop">
          <div className="modal-card modal-wide">
            <div className="modal-header">
              <div className="min-w-0">
                <p className="eyebrow">Health record</p>
                <h2 className="modal-title truncate">{viewingFile.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setViewingFile(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-slate-50 p-3">
              {viewingFile.type.startsWith('image/') ? (
                <img
                  src={viewingFile.url}
                  alt={viewingFile.name}
                  className="mx-auto max-h-[65vh] rounded-xl object-contain"
                />
              ) : viewingFile.type === 'application/pdf' ? (
                <iframe
                  src={viewingFile.url}
                  title={viewingFile.name}
                  className="h-[65vh] w-full rounded-xl border-0"
                />
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <FileText size={42} className="text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-600">
                    Preview is not available for this file type.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <a
                className="btn btn-light"
                href={viewingFile.url}
                download={viewingFile.name}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={17} />
                Download
              </a>
              <button className="btn btn-primary" onClick={() => setViewingFile(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Records;
