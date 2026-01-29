import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export default function CardDetectionModal() {
  const {
    detectedCard,
    projects,
    setShowCardModal,
    setDetectedCard,
    setCurrentProject,
    setCurrentView,
    setProjectImages,
    setShowNewProjectModal,
    setPendingFiles,
  } = useAppStore();

  const [selectedProject, setSelectedProject] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  if (!detectedCard) return null;

  const handleClose = () => {
    setShowCardModal(false);
    setDetectedCard(null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedProject) return;

    setIsImporting(true);

    const results = await window.electronAPI.importFromCard(
      detectedCard.dcimPath,
      selectedProject
    );

    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    setImportResult({ success, failed });
    setIsImporting(false);

    // Navigate to the project
    const project = projects.find((p) => p.path === selectedProject);
    if (project) {
      setCurrentProject(project);
      setCurrentView('project');
      const images = await window.electronAPI.getProjectImages(project.path);
      setProjectImages(images);
    }
  };

  const handleCreateNewProject = async () => {
    // Get all DCIM images
    const images = await window.electronAPI.getDCIMImages(detectedCard.dcimPath);
    setPendingFiles(images);
    setShowCardModal(false);
    setShowNewProjectModal(true);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Cartão Detectado</h2>
              <p className="text-sm text-gray-400">{detectedCard.drive}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-app-primary/50 rounded-lg">
          <p className="text-lg font-medium text-white">
            {detectedCard.imageCount} imagens encontradas
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Pasta DCIM detectada em {detectedCard.dcimPath}
          </p>
        </div>

        {importResult ? (
          <div className="mb-6">
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-300">
                Importação concluída: {importResult.success} arquivos importados
                {importResult.failed > 0 && (
                  <span className="text-red-300"> ({importResult.failed} falhas)</span>
                )}
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleClose} className="btn btn-primary">
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <p className="text-gray-300">
                Deseja importar as fotos para qual projeto?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecione um projeto existente
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="select"
                >
                  <option value="">-- Selecione --</option>
                  {projects.map((project) => (
                    <option key={project.path} value={project.path}>
                      {project.name} ({project.folderName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-gray-500">ou</div>

              <button
                onClick={handleCreateNewProject}
                className="btn btn-secondary w-full"
              >
                Criar Novo Projeto
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleClose} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedProject || isImporting}
                className="btn btn-primary flex items-center gap-2"
              >
                {isImporting && <div className="spinner w-4 h-4" />}
                {isImporting ? 'Importando...' : 'Importar Fotos'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
