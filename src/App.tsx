import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { DocumentsList } from './components/Documents/DocumentsList';
import { ViewerSelector } from './components/Viewer/ViewerSelector';
import { ConnectionsView } from './components/Connections/ConnectionsView';
import type { Database } from './lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'documents' | 'viewer' | 'connections'>('documents');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 overflow-hidden">
        {activeView === 'documents' && (
          <DocumentsList onSelectDocument={setSelectedDocument} />
        )}
        {activeView === 'viewer' && (
          <ViewerSelector />
        )}
        {activeView === 'connections' && (
          <ConnectionsView />
        )}
      </main>
    </div>
  );
}

export default App;
