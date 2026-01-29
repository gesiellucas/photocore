import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Template } from '../types';

export default function NewProjectModal() {
  const {
    pendingFiles,
    importProgress,
    setShowNewProjectModal,
    setPendingFiles,
    setProjects,
    setCurrentProject,
    setCurrentView,
    setProjectImages,
    setImportProgress,
  } = useAppStore();

  const [eventName, setEventName] = useState('');
  const [template, setTemplate] = useState<Template>('default');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for import progress
    window.electronAPI.onImportProgress((progress) => {
      setImportProgress(progress);
    });

    return () => {
      window.electronAPI.removeImportProgressListener();
    };
  }, []);

  const toPascalCasePreview = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  const handleClose = () => {
    if (isCreating) return; // Prevent closing while importing
    setShowNewProjectModal(false);
    setPendingFiles([]);
    setEventName('');
    setError('');
    setImportProgress(null);
  };

  const handleCreate = async () => {
    if (!eventName.trim()) {
      setError('Por favor, insira o nome do evento');
      return;
    }

    setIsCreating(true);
    setError('');

    const result = await window.electronAPI.createProject(eventName.trim(), template);

    if (!result.success) {
      setError(result.error || 'Erro ao criar projeto');
      setIsCreating(false);
      return;
    }

    // If there are pending files, move them to the project
    if (pendingFiles.length > 0 && result.path) {
      await window.electronAPI.moveFilesToProject(pendingFiles, result.path);
    }

    // Clear progress
    setImportProgress(null);

    // Refresh projects list
    const projects = await window.electronAPI.getProjects();
    setProjects(projects);

    // Navigate to the new project
    const newProject = projects.find((p) => p.path === result.path);
    if (newProject) {
      setCurrentProject(newProject);
      setCurrentView('project');
      const images = await window.electronAPI.getProjectImages(newProject.path);
      setProjectImages(images);
    }

    setIsCreating(false);
    handleClose();
  };

  const folderPreview = eventName.trim()
    ? `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}_${String(new Date().getDate()).padStart(2, '0')}_${toPascalCasePreview(eventName)}`
    : '';

  const progressPercent = importProgress
    ? Math.round((importProgress.completed / importProgress.total) * 100)
    : 0;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Novo Projeto</h2>
          {!isCreating && (
            <button onClick={handleClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {pendingFiles.length > 0 && (
          <div className="mb-4 p-3 bg-app-primary/50 rounded-lg">
            <p className="text-sm text-gray-300">
              {pendingFiles.length} arquivo(s) selecionado(s) para importar
            </p>
          </div>
        )}

        {/* Progress bar during import */}
        {isCreating && importProgress && (
          <div className="mb-4 p-4 bg-app-primary/50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Importando arquivos...</span>
              <span>{importProgress.completed} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-app-accent h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">
              {importProgress.currentFile}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Evento
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ex: Casamento João e Maria"
              className="input"
              autoFocus
              disabled={isCreating}
            />
            {folderPreview && (
              <p className="mt-2 text-sm text-gray-400">
                Pasta: <span className="font-mono text-app-accent">{folderPreview}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as Template)}
              className="select"
              disabled={isCreating}
            >
              <option value="default">Padrão (RAW, JPG, Editados)</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Cria as pastas RAW, JPG e Editados automaticamente
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleClose} className="btn btn-ghost" disabled={isCreating}>
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn btn-primary flex items-center gap-2"
          >
            {isCreating && <div className="spinner w-4 h-4" />}
            {isCreating ? 'Importando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  );
}
