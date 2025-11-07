import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link2, Plus, X, FileText, Trash2, Edit2, ArrowRight } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Connection = Database['public']['Tables']['connections']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

export function ConnectionsView() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [connectionsRes, docsRes] = await Promise.all([
        supabase
          .from('connections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (connectionsRes.error) throw connectionsRes.error;
      if (docsRes.error) throw docsRes.error;

      setConnections(connectionsRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConnections(connections.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const getDocumentTitle = (id: string) => {
    return documents.find(d => d.id === id)?.title || 'Unknown Document';
  };

  const getConnectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      related: 'bg-blue-100 text-blue-700',
      supports: 'bg-green-100 text-green-700',
      contradicts: 'bg-red-100 text-red-700',
      expands: 'bg-purple-100 text-purple-700',
      cites: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || colors.related;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Connections</h2>
          <p className="text-slate-600 mt-1">Visualize relationships between your documents</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={18} />
          Create Connection
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12">
          <Link2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 mb-4">No connections yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Create your first connection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText size={18} className="text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-slate-900">
                      {getDocumentTitle(conn.source_document_id)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowRight size={18} className="text-slate-400" />
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConnectionTypeColor(conn.connection_type)}`}>
                      {conn.connection_type}
                    </span>
                    <ArrowRight size={18} className="text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <FileText size={18} className="text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-slate-900">
                      {getDocumentTitle(conn.target_document_id)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteConnection(conn.id)}
                  className="text-red-600 hover:text-red-700 transition ml-4"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {conn.notes && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1 font-medium">Notes:</div>
                  <div className="text-sm text-slate-800">{conn.notes}</div>
                </div>
              )}

              <div className="mt-3 text-xs text-slate-500">
                Created {new Date(conn.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateConnectionModal
          documents={documents}
          onClose={() => setShowCreateForm(false)}
          onSave={() => {
            setShowCreateForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface CreateConnectionModalProps {
  documents: Document[];
  onClose: () => void;
  onSave: () => void;
}

function CreateConnectionModal({ documents, onClose, onSave }: CreateConnectionModalProps) {
  const { user } = useAuth();
  const [sourceDocId, setSourceDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');
  const [connectionType, setConnectionType] = useState('related');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectionTypes = [
    { value: 'related', label: 'Related', description: 'Documents share similar topics or themes' },
    { value: 'supports', label: 'Supports', description: 'Target document supports source document' },
    { value: 'contradicts', label: 'Contradicts', description: 'Documents present conflicting information' },
    { value: 'expands', label: 'Expands', description: 'Target expands on ideas from source' },
    { value: 'cites', label: 'Cites', description: 'Source document cites target document' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (sourceDocId === targetDocId) {
      setError('Please select two different documents');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          source_document_id: sourceDocId,
          target_document_id: targetDocId,
          connection_type: connectionType,
          notes,
        });

      if (error) throw error;
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">Create Connection</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="sourceDoc" className="block text-sm font-medium text-slate-700 mb-1">
              Source Document
            </label>
            <select
              id="sourceDoc"
              value={sourceDocId}
              onChange={(e) => setSourceDocId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a document...</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="connectionType" className="block text-sm font-medium text-slate-700 mb-1">
              Connection Type
            </label>
            <div className="space-y-2">
              {connectionTypes.map(type => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    connectionType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="connectionType"
                    value={type.value}
                    checked={connectionType === type.value}
                    onChange={(e) => setConnectionType(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{type.label}</div>
                    <div className="text-sm text-slate-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="targetDoc" className="block text-sm font-medium text-slate-700 mb-1">
              Target Document
            </label>
            <select
              id="targetDoc"
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a document...</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add details about this connection..."
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
              {loading ? 'Creating...' : 'Create Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
