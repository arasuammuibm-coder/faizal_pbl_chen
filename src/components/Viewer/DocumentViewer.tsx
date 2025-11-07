import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, MessageSquare, Highlighter, Maximize2, Minimize2 } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Annotation = Database['public']['Tables']['annotations']['Row'];

interface DocumentViewerProps {
  documents: Document[];
  onClose: () => void;
}

export function DocumentViewer({ documents, onClose }: DocumentViewerProps) {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({});
  const [selectedText, setSelectedText] = useState<{
    text: string;
    docId: string;
    start: number;
    end: number;
  } | null>(null);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnnotations();
  }, [documents]);

  const loadAnnotations = async () => {
    if (!user) return;

    const docIds = documents.map(d => d.id);
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .in('document_id', docIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading annotations:', error);
      return;
    }

    const grouped = data.reduce((acc, ann) => {
      if (!acc[ann.document_id]) acc[ann.document_id] = [];
      acc[ann.document_id].push(ann);
      return acc;
    }, {} as Record<string, Annotation[]>);

    setAnnotations(grouped);
  };

  const handleTextSelection = (docId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const range = selection.getRangeAt(0);
    const text = selection.toString();

    const preCaretRange = range.cloneRange();
    const container = document.getElementById(`doc-${docId}`);
    if (container) {
      preCaretRange.selectNodeContents(container);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;
      const end = start + text.length;

      setSelectedText({ text, docId, start, end });
      setShowAnnotationForm(true);
    }
  };

  const renderDocumentWithHighlights = (doc: Document) => {
    const docAnnotations = annotations[doc.id] || [];
    if (docAnnotations.length === 0) {
      return doc.content;
    }

    const highlights = docAnnotations
      .sort((a, b) => a.position_start - b.position_start);

    const segments = [];
    let lastIndex = 0;

    highlights.forEach(ann => {
      if (ann.position_start > lastIndex) {
        segments.push({
          text: doc.content.substring(lastIndex, ann.position_start),
          highlighted: false,
        });
      }

      segments.push({
        text: doc.content.substring(ann.position_start, ann.position_end),
        highlighted: true,
        annotation: ann,
      });

      lastIndex = ann.position_end;
    });

    if (lastIndex < doc.content.length) {
      segments.push({
        text: doc.content.substring(lastIndex),
        highlighted: false,
      });
    }

    return (
      <>
        {segments.map((segment, idx) =>
          segment.highlighted ? (
            <mark
              key={idx}
              className={`bg-${segment.annotation?.color}-200 cursor-pointer hover:bg-${segment.annotation?.color}-300 transition`}
              title={segment.annotation?.content}
              style={{
                backgroundColor: getHighlightColor(segment.annotation?.color || 'yellow'),
              }}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={idx}>{segment.text}</span>
          )
        )}
      </>
    );
  };

  const getHighlightColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: '#fef08a',
      green: '#bbf7d0',
      blue: '#bfdbfe',
      pink: '#fbcfe8',
      purple: '#e9d5ff',
    };
    return colors[color] || colors.yellow;
  };

  const gridCols = documents.length === 1 ? 'grid-cols-1' : documents.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      ref={viewerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-slate-50`}
    >
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Document Viewer ({documents.length} {documents.length === 1 ? 'document' : 'documents'})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className={`grid ${gridCols} gap-4 p-4 ${isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-[calc(100vh-200px)]'} overflow-hidden`}>
        {documents.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="border-b border-slate-200 p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-1">{doc.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{doc.tags.join(', ')}</span>
                <span>•</span>
                <span>{annotations[doc.id]?.length || 0} annotations</span>
              </div>
            </div>

            <div
              id={`doc-${doc.id}`}
              className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none"
              onMouseUp={() => handleTextSelection(doc.id)}
              style={{ lineHeight: '1.8' }}
            >
              {renderDocumentWithHighlights(doc)}
            </div>

            <div className="border-t border-slate-200 p-3 bg-slate-50">
              <div className="text-xs text-slate-600">
                Select text to add annotations and highlights
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAnnotationForm && selectedText && (
        <AnnotationForm
          selectedText={selectedText}
          onClose={() => {
            setShowAnnotationForm(false);
            setSelectedText(null);
          }}
          onSave={() => {
            setShowAnnotationForm(false);
            setSelectedText(null);
            loadAnnotations();
          }}
        />
      )}
    </div>
  );
}

interface AnnotationFormProps {
  selectedText: {
    text: string;
    docId: string;
    start: number;
    end: number;
  };
  onClose: () => void;
  onSave: () => void;
}

function AnnotationForm({ selectedText, onClose, onSave }: AnnotationFormProps) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [color, setColor] = useState('yellow');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('annotations')
        .insert({
          user_id: user.id,
          document_id: selectedText.docId,
          content: note,
          highlighted_text: selectedText.text,
          position_start: selectedText.start,
          position_end: selectedText.end,
          color,
        });

      if (error) throw error;
      onSave();
    } catch (error) {
      console.error('Error saving annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: 'yellow', bg: '#fef08a' },
    { name: 'green', bg: '#bbf7d0' },
    { name: 'blue', bg: '#bfdbfe' },
    { name: 'pink', bg: '#fbcfe8' },
    { name: 'purple', bg: '#e9d5ff' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Highlighter size={20} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900">Add Annotation</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Selected text:</div>
            <div className="text-sm text-slate-900 italic">"{selectedText.text}"</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Highlight Color
            </label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-10 h-10 rounded-lg border-2 transition ${
                    color === c.name ? 'border-blue-600 scale-110' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add your thoughts about this passage..."
            />
          </div>

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
              {loading ? 'Saving...' : 'Save Annotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
