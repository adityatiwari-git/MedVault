import React from 'react';
import { getUserDocuments, createUserDocument, updateUserDocument, deleteUserDocument } from '../services/storage.js';

function Records({ user }) {
  try {
    const [documents, setDocuments] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showUploadForm, setShowUploadForm] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState('All');
    const [uploadForm, setUploadForm] = React.useState({
      fileName: '',
      category: 'General Health',
      notes: '',
      file: null
    });
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [showFileViewer, setShowFileViewer] = React.useState(false);
    const [viewingFile, setViewingFile] = React.useState(null);
    const [editingDoc, setEditingDoc] = React.useState(null);
    const fileInputRef = React.useRef(null);

    const categories = ['All', 'Prescription', 'Lab Report', 'Scan', 'Menstrual', 'General Health'];

    React.useEffect(() => { loadDocuments(); }, [user]);

    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const docs = await getUserDocuments(user.objectId);
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleFileSelect = (file) => {
      if (!file) return;
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 2MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (images, PDF, or documents)');
        return;
      }

      setUploadForm((prev) => ({
        ...prev,
        file,
        fileName: prev.fileName || file.name.split('.').slice(0, -1).join('.'),
      }));
    };

    const resetForm = () => {
      setUploadForm({ fileName: '', category: 'General Health', notes: '', file: null });
      setEditingDoc(null);
      setShowUploadForm(false);
      setIsDragging(false);
      setUploadProgress(0);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files?.[0]);
    };

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!uploadForm.fileName.trim()) {
        alert('Please enter a document name');
        return;
      }

      setUploadProgress(25);

      try {
        if (editingDoc) {
          await updateUserDocument(user.objectId, editingDoc.objectId, {
            fileName: uploadForm.fileName,
            category: uploadForm.category,
            notes: uploadForm.notes,
            file: uploadForm.file,
          });
        } else {
          await createUserDocument(user.objectId, {
            fileName: uploadForm.fileName,
            category: uploadForm.category,
            notes: uploadForm.notes,
            file: uploadForm.file,
          });
        }

        setUploadProgress(100);
        resetForm();
        await loadDocuments();
      } catch (error) {
        console.error('Error saving document:', error);
        alert(error.message || 'Unable to save document. Please try again.');
        setUploadProgress(0);
      }
    };

    const handleEdit = (doc) => {
      setUploadForm({
        fileName: doc.objectData.FileName,
        category: doc.objectData.Category || 'General Health',
        notes: doc.objectData.Notes || '',
        file: null,
      });
      setEditingDoc(doc);
      setShowUploadForm(true);
    };

    const handleDelete = async (docId) => {
      if (!confirm('Are you sure you want to delete this document?')) return;

      try {
        await deleteUserDocument(user.objectId, docId);
        await loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert(error.message || 'Failed to delete document. Please try again.');
      }
    };

    const handleViewFile = (doc) => {
      const data = doc.objectData;
      if (!data.HasFile || !data.FileURL) return;

      setViewingFile({
        name: data.FileName,
        url: data.FileURL,
        type: data.FileType || '',
        size: data.FileSize || 0,
      });
      setShowFileViewer(true);
    };

    const filteredDocuments = selectedCategory === 'All'
      ? documents
      : documents.filter(doc => doc.objectData.Category === selectedCategory);

    if (isLoading) return <div className="animate-pulse">Loading documents...</div>;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <button onClick={() => setShowUploadForm(true)} className="btn btn-primary flex items-center space-x-2">
            <div className="icon-plus text-lg" />
            <span>Upload Document</span>
          </button>
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === category ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {showUploadForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && resetForm()}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">{editingDoc ? 'Edit Document' : 'Upload New Document'}</h3>

              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="text"
                  placeholder="Document Name"
                  className="input-field"
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, fileName: e.target.value }))}
                  required
                />

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-purple-400 bg-purple-50' : uploadForm.file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-purple-300'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                  {uploadForm.file ? (
                    <div className="space-y-2">
                      <div className="icon-check-circle text-2xl text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-green-700">{uploadForm.file.name}</p>
                      <p className="text-xs text-gray-500">{(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button type="button" onClick={() => setUploadForm((prev) => ({ ...prev, file: null }))} className="text-red-500 text-sm hover:underline">
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="icon-upload text-2xl text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">Drop files here or</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-purple-600 hover:text-purple-700 font-medium">
                        browse files
                      </button>
                      <p className="text-xs text-gray-400">Images, PDFs, documents (max 2MB)</p>
                    </div>
                  )}
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{uploadProgress === 100 ? 'Saved' : 'Saving...'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <select className="input-field" value={uploadForm.category} onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}>
                  {categories.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <textarea
                  placeholder="Notes (optional)"
                  className="input-field h-20 resize-none"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, notes: e.target.value }))}
                />

                <div className="flex space-x-3">
                  <button type="submit" className="btn btn-primary flex-1" disabled={uploadProgress > 0 && uploadProgress < 100}>
                    {editingDoc ? 'Update Document' : 'Save Document'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFileViewer && viewingFile && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{viewingFile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {viewingFile.type || 'File'} • {(viewingFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={() => setShowFileViewer(false)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                  <div className="icon-x text-xl" />
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-auto">
                {viewingFile.type.startsWith('image/') ? (
                  <img src={viewingFile.url} alt={viewingFile.name} className="max-w-full h-auto mx-auto rounded-lg" />
                ) : viewingFile.type === 'application/pdf' ? (
                  <div className="w-full h-96"><iframe src={viewingFile.url} className="w-full h-full border rounded-lg" title={viewingFile.name} /></div>
                ) : (
                  <div className="text-center py-8">
                    <div className="icon-file text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Preview is not available for this file type. Use Download.</p>
                  </div>
                )}
              </div>

              <div className="border-t p-4 flex justify-end space-x-3">
                <a href={viewingFile.url} download={viewingFile.name} target="_blank" rel="noreferrer" className="btn btn-secondary flex items-center space-x-2">
                  <div className="icon-download text-lg" />
                  <span>Download</span>
                </a>
                <button onClick={() => setShowFileViewer(false)} className="btn btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const hasFile = doc.objectData.HasFile;
            const fileType = doc.objectData.FileType || '';
            const isImage = fileType.startsWith('image/');
            const isPDF = fileType === 'application/pdf';
            const fileSize = doc.objectData.FileSize || 0;

            return (
              <div key={doc.objectId} className="card hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {hasFile && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {isImage ? <div className="icon-image text-3xl text-blue-500" /> : isPDF ? <div className="icon-file-text text-3xl text-red-500" /> : <div className="icon-file text-3xl text-gray-500" />}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900">{doc.objectData.FileName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{doc.objectData.Category}</span>
                      {hasFile && <span className="text-xs text-gray-500">{(fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                    </div>
                  </div>

                  {doc.objectData.Notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{doc.objectData.Notes}</p>}

                  <div className="flex gap-2">
                    {hasFile && <button onClick={() => handleViewFile(doc)} className="btn btn-secondary flex-1">View</button>}
                    <button onClick={() => handleEdit(doc)} className="btn btn-secondary flex-1">Edit</button>
                    <button onClick={() => handleDelete(doc.objectId)} className="btn btn-secondary flex-1 text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="card text-center py-12">
            <div className="icon-folder-open text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No health records in this category yet.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Records component error:', error);
    return <div className="text-center py-12 text-red-600">Unable to load health records.</div>;
  }
}

export default Records;
