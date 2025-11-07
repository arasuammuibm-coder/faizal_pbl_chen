import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Plus, FileText, Trash2, Tag, Search, X } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentsListProps {
  onSelectDocument: (doc: Document) => void;
}

export function DocumentsList({ onSelectDocument }: DocumentsListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  useEffect(() => {
    const tags = new Set<string>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags).sort());
  }, [documents]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => doc.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Your Documents</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} />
            Upload Document
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Tag size={14} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 mb-4">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </p>
          {documents.length === 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer group"
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.title}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                {doc.content.substring(0, 150)}...
              </p>

              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={() => {
            setShowUpload(false);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
}

interface UploadModalProps {
  onClose: () => void;
  onUpload: () => void;
}

function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          file_size: content.length,
          file_type: 'txt',
        });

      if (error) throw error;
      onUpload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload File (Text)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700">Choose a file</span>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-1">or paste content below</p>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Document title"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Paste or type document content..."
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="research, biology, chemistry"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
