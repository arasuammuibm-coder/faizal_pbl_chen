import { useAuth } from '../../contexts/AuthContext';
import { LogOut, FileText, Grid, Link2 } from 'lucide-react';

interface HeaderProps {
  activeView: 'documents' | 'viewer' | 'connections';
  onViewChange: (view: 'documents' | 'viewer' | 'connections') => void;
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-slate-900">Context Weaver</h1>

          <nav className="flex gap-2">
            <button
              onClick={() => onViewChange('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeView === 'documents'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} />
              Documents
            </button>
            <button
              onClick={() => onViewChange('viewer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeView === 'viewer'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Grid size={18} />
              Viewer
            </button>
            <button
              onClick={() => onViewChange('connections')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeView === 'connections'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Link2 size={18} />
              Connections
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
