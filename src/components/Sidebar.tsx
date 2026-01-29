import { useAppStore } from '../stores/appStore';

export default function Sidebar() {
  const {
    projects,
    setCurrentProject,
    setCurrentView,
    setShowNewProjectModal,
    setProjectImages,
    setShowTagManager,
    setProjectImageTags,
    setGlobalTags,
  } = useAppStore();

  const handleProjectClick = async (project: typeof projects[0]) => {
    setCurrentProject(project);
    setCurrentView('project');

    // Load images and tags in parallel
    const [images, globalTags, imageTags] = await Promise.all([
      window.electronAPI.getProjectImages(project.path),
      window.electronAPI.getGlobalTags(),
      window.electronAPI.getProjectImageTags(project.path),
    ]);

    setProjectImages(images);
    setGlobalTags(globalTags);
    setProjectImageTags(imageTags);
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleManageTags = () => {
    setShowTagManager(true);
  };

  return (
    <aside className="w-64 bg-app-surface border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleNewProject}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Projeto
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Projetos Recentes
        </h3>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum projeto ainda</p>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 10).map((project) => (
              <button
                key={project.path}
                onClick={() => handleProjectClick(project)}
                className="w-full text-left p-3 rounded-lg hover:bg-app-primary transition-colors"
              >
                <p className="font-medium text-white truncate">{project.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={handleManageTags}
          className="btn btn-ghost w-full flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Gerenciar Tags
        </button>
        <button
          onClick={() => {
            setCurrentView('home');
            setCurrentProject(null);
          }}
          className="btn btn-ghost w-full flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </button>
      </div>
    </aside>
  );
}
