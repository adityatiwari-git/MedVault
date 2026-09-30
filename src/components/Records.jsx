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

    React.useEffect(() => {
      loadDocuments();
    }, [user]);

    const loadDocuments = async () => {
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
      if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        if (file.size > maxSize) {
          alert('File size must be less than 10MB');
          return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          alert('Please select a valid file type (images, PDF, or documents)');
          return;
        }

        setUploadForm({
          ...uploadForm,
          file: file,
          fileName: uploadForm.fileName || file.name.split('.').slice(0, -1).join('.')
        });
      }
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
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const convertFileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const simulateUpload = async (file) => {
      return new Promise(async (resolve) => {
        let progress = 0;
        const interval = setInterval(async () => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Convert file to base64 for storage
            try {
              const base64Data = await convertFileToBase64(file);
              resolve(base64Data);
            } catch (error) {
              console.error('Error converting file:', error);
              resolve('');
            }
          }
          setUploadProgress(Math.min(progress, 100));
        }, 200);
      });
    };

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!uploadForm.fileName.trim()) {
        alert('Please enter a document name');
        return;
      }

      try {
        setUploadProgress(0);
        
        if (editingDoc) {
          // Update existing document
          let updateData = {
            FileName: uploadForm.fileName,
            Category: uploadForm.category,
            Notes: uploadForm.notes
          };

          // Only update file if a new one was uploaded
          if (uploadForm.file) {
            updateData.FileType = uploadForm.file.type;
            updateData.FileSize = uploadForm.file.size;
            updateData.HasFile = true;
          }

          await updateUserDocument(user.objectId, editingDoc.objectId, { fileName: updateData.FileName, category: updateData.Category, notes: updateData.Notes, file: uploadForm.file });
        } else {
          // Create new document
          const fileType = uploadForm.file?.type || '';
          const fileSize = uploadForm.file?.size || 0;

          const documentData = {
            fileName: uploadForm.fileName,
            category: uploadForm.category,
            notes: uploadForm.notes,
            file: uploadForm.file,
            fileType: fileType,
            fileSize: fileSize,
            hasFile: !!uploadForm.file
          };

          await createUserDocument(user.objectId, documentData);
        }
        
        setUploadForm({ fileName: '', category: 'General Health', notes: '', file: null });
        setEditingDoc(null);
        setUploadProgress(0);
        setShowUploadForm(false);
        loadDocuments();
      } catch (error) {
        console.error('Error uploading document:', error);
        alert('Upload failed. Please try again.');
      }
    };

    const handleEdit = (doc) => {
      setUploadForm({
        fileName: doc.objectData.FileName,
        category: doc.objectData.Category,
        notes: doc.objectData.Notes || '',
        file: null
      });
      setEditingDoc(doc);
      setShowUploadForm(true);
    };

    const handleDelete = async (docId) => {
      if (confirm('Are you sure you want to delete this document?')) {
        try {
          await deleteUserDocument(user.objectId, docId);
          loadDocuments();
        } catch (error) {
          console.error('Error deleting document:', error);
          alert('Failed to delete document. Please try again.');
        }
      }
    };

    const handleViewFile = (doc) => {
      if (doc.objectData.HasFile && doc.objectData.FileURL) {
        // Create a blob URL for viewing and downloading
        let displayUrl = doc.objectData.FileURL;
        
        // If it's base64 data, use it directly for images and create blob for other files
        if (doc.objectData.FileURL.startsWith('data:')) {
          if (doc.objectData.FileType.startsWith('image/')) {
            displayUrl = doc.objectData.FileURL;
          } else {
            // Convert base64 to blob for non-image files
            try {
              const base64Response = fetch(doc.objectData.FileURL);
              base64Response.then(res => res.blob()).then(blob => {
                displayUrl = URL.createObjectURL(blob);
              });
            } catch (error) {
              console.error('Error creating blob URL:', error);
            }
          }
        }

        setViewingFile({
          name: doc.objectData.FileName,
          url: displayUrl,
          originalData: doc.objectData.FileURL,
          type: doc.objectData.FileType,
          size: doc.objectData.FileSize
        });
        setShowFileViewer(true);
      }
    };

    const filteredDocuments = selectedCategory === 'All' 
      ? documents 
      : documents.filter(doc => doc.objectData.Category === selectedCategory);

    if (isLoading) {
      return <div className="animate-pulse">Loading documents...</div>;
    }

    return (
      <div className="space-y-6" data-name="records" data-file="components/Records.js">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <div className="icon-plus text-lg"></div>
            <span>Upload Document</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="text"
                  placeholder="Document Name"
                  className="input-field"
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                  required
                />
                
                {/* File Upload Area */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Upload File (optional)</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging 
                        ? 'border-purple-400 bg-purple-50' 
                        : uploadForm.file 
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-purple-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                    
                    {uploadForm.file ? (
                      <div className="space-y-2">
                        <div className="icon-check-circle text-2xl text-green-500 mx-auto"></div>
                        <p className="text-sm font-medium text-green-700">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-500">{(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                          type="button"
                          onClick={() => setUploadForm({...uploadForm, file: null})}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="icon-upload text-2xl text-gray-400 mx-auto"></div>
                        <div>
                          <p className="text-sm text-gray-600">Drop files here or</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            browse files
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">Images, PDFs, documents (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Uploading...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                  </div>
                )}
                
                <select
                  className="input-field"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Notes (optional)"
                  className="input-field h-20 resize-none"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                />
                <div className="flex space-x-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                  >
                    {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : editingDoc ? 'Update Document' : 'Save Document'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadForm({ fileName: '', category: 'General Health', notes: '', file: null });
                      setEditingDoc(null);
                      setUploadProgress(0);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* File Viewer Modal */}
        {showFileViewer && viewingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{viewingFile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {viewingFile.type} • {(viewingFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setShowFileViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="icon-x text-xl"></div>
                </button>
              </div>
              
              <div className="p-4 max-h-[70vh] overflow-auto">
                {viewingFile.type.startsWith('image/') ? (
                  <img 
                    src={viewingFile.url} 
                    alt={viewingFile.name}
                    className="max-w-full h-auto mx-auto rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : viewingFile.type === 'application/pdf' ? (
                  <div className="w-full h-96">
                    <iframe 
                      src={viewingFile.originalData || viewingFile.url}
                      className="w-full h-full border rounded-lg"
                      title={viewingFile.name}
                    ></iframe>
                  </div>
                ) : viewingFile.type.startsWith('text/') ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Text file preview not available. Click download to view content.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="icon-file text-4xl text-gray-400 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preview not available for this file type</p>
                  </div>
                )}
                
                <div className="hidden text-center py-8" style={{display: 'none'}}>
                  <div className="icon-alert-circle text-4xl text-red-400 mx-auto mb-4"></div>
                  <p className="text-red-600">File could not be loaded</p>
                </div>
              </div>
              
              <div className="border-t p-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    // Create download link for base64 data
                    const link = document.createElement('a');
                    link.href = viewingFile.originalData || viewingFile.url;
                    link.download = viewingFile.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <div className="icon-download text-lg"></div>
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowFileViewer(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const hasFile = doc.objectData.HasFile;
            const fileType = doc.objectData.FileType || '';
            const isImage = fileType.startsWith('image/');
            const isPDF = fileType === 'application/pdf';
            const fileSize = doc.objectData.FileSize;
            
            return (
              <div key={doc.objectId} className="card hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* File Preview */}
                  {hasFile && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <div className="icon-image text-3xl text-blue-500"></div>
                        </div>
                      ) : isPDF ? (
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                          <div className="icon-file-text text-3xl text-red-500"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="icon-file text-3xl text-gray-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hasFile 
                        ? isImage 
                          ? 'bg-blue-100' 
                          : isPDF 
                          ? 'bg-red-100' 
                          : 'bg-gray-100'
                        : 'bg-purple-100'
                    }`}>
                      <div className={`text-lg ${
                        hasFile 
                          ? isImage 
                            ? 'icon-image text-blue-600' 
                            : isPDF 
                            ? 'icon-file-text text-red-600' 
                            : 'icon-file text-gray-600'
                          : 'icon-folder text-purple-600'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{doc.objectData.FileName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {doc.objectData.Category}
                        </span>
                        {hasFile && fileSize && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {(fileSize / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(doc.objectData.DateUploaded).toLocaleDateString()}
                      </p>
                      {doc.objectData.Notes && (
                        <p className="text-sm text-gray-600 mt-2">{doc.objectData.Notes}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-3">
                        {hasFile && (
                          <button 
                            onClick={() => handleViewFile(doc)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                          >
                            <div className="icon-eye text-sm"></div>
                            <span>View</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(doc)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <div className="icon-edit text-sm"></div>
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.objectId)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                        >
                          <div className="icon-trash-2 text-sm"></div>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-folder-open text-4xl text-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500">No documents found in this category</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Records component error:', error);
    return null;
  }
}
export default Records;
