import { useAppStore } from '../stores/appStore';

export default function Header() {
  const { currentProject, currentView, setCurrentView, setCurrentProject } = useAppStore();

  const handleBack = () => {
    setCurrentView('home');
    setCurrentProject(null);
  };

  return (
    <header className="drag-region bg-app-surface border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4 no-drag">
        {currentView === 'project' && (
          <button
            onClick={handleBack}
            className="btn btn-ghost flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        )}
        <h1 className="text-xl font-bold text-white">
          {currentView === 'home' ? 'Photo Core' : currentProject?.name || 'Projeto'}
        </h1>
      </div>

      <div className="flex items-center gap-4 no-drag">
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}
