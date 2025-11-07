import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Grid, FileText, X, Check } from 'lucide-react';
import { DocumentViewer } from './DocumentViewer';
import type { Database } from '../../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

export function ViewerSelector() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [user]);

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

  const toggleDocument = (doc: Document) => {
    if (selectedDocs.find(d => d.id === doc.id)) {
      setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
    } else {
      if (selectedDocs.length < 3) {
        setSelectedDocs([...selectedDocs, doc]);
      }
    }
  };

  if (selectedDocs.length > 0) {
    return (
      <DocumentViewer
        documents={selectedDocs}
        onClose={() => setSelectedDocs([])}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Multi-Document Viewer</h2>
        <p className="text-slate-600">
          Select up to 3 documents to view side-by-side with annotation capabilities
        </p>
      </div>

      {selectedDocs.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-blue-900">
              Selected Documents ({selectedDocs.length}/3)
            </div>
            <button
              onClick={() => setSelectedDocs([])}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-sm"
              >
                <FileText size={14} />
                <span>{doc.title}</span>
                <button
                  onClick={() => toggleDocument(doc)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <Grid size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 mb-4">No documents available</p>
          <p className="text-sm text-slate-500">Upload documents first to use the viewer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const isSelected = selectedDocs.find(d => d.id === doc.id);
            const canSelect = selectedDocs.length < 3 || isSelected;

            return (
              <button
                key={doc.id}
                onClick={() => canSelect && toggleDocument(doc)}
                disabled={!canSelect}
                className={`text-left bg-white border-2 rounded-lg p-4 transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : canSelect
                    ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    : 'border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText size={20} className={isSelected ? 'text-blue-600' : 'text-slate-600'} />
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.title}</h3>
                  </div>
                  {isSelected && (
                    <div className="bg-blue-600 text-white rounded-full p-1">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {doc.content.substring(0, 100)}...
                </p>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
