import { useCallback, useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import ImageGrid from './ImageGrid';
import FilterBar from './FilterBar';
import DropZone from './DropZone';
import TagFilter from './TagFilter';

export default function ProjectView() {
  const {
    currentProject,
    projectImages,
    setProjectImages,
    selectedTags,
    setProjectImageTags,
    setGlobalTags,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'RAW' | 'JPG' | 'Editados'>('all');

  // Load global tags and project image tags when project changes
  useEffect(() => {
    if (currentProject) {
      loadTagsData();
    }
  }, [currentProject?.path]);

  const loadTagsData = async () => {
    if (!currentProject) return;

    const [globalTags, imageTags] = await Promise.all([
      window.electronAPI.getGlobalTags(),
      window.electronAPI.getProjectImageTags(currentProject.path),
    ]);

    setGlobalTags(globalTags);
    setProjectImageTags(imageTags);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Nenhum projeto selecionado</p>
      </div>
    );
  }

  const handleFilterChange = async (filter: 'all' | 'RAW' | 'JPG' | 'Editados') => {
    setCurrentFilter(filter);
    await refreshImages(filter);
  };

  const handleTagFilterChange = async () => {
    await refreshImages(currentFilter);
  };

  const refreshImages = async (filter: 'all' | 'RAW' | 'JPG' | 'Editados' = currentFilter) => {
    if (!currentProject) return;

    setIsLoading(true);
    const filterValue = filter === 'all' ? undefined : filter;
    const images = await window.electronAPI.getProjectImages(currentProject.path, filterValue);

    // Also refresh image tags
    const imageTags = await window.electronAPI.getProjectImageTags(currentProject.path);
    setProjectImageTags(imageTags);

    // Filter by selected tags if any
    let filteredImages = images;
    if (selectedTags.length > 0) {
      filteredImages = images.filter((img) => {
        const imageTagsString = imageTags[img.name] || '';
        const imgTags = imageTagsString ? imageTagsString.split(',').map(t => t.trim()) : [];
        return selectedTags.some(tag => imgTags.includes(tag));
      });
    }

    setProjectImages(filteredImages);
    setIsLoading(false);
  };

  const handleFileDrop = useCallback(async (files: string[]) => {
    if (!currentProject) return;

    const imageFiles = files.filter((f) => {
      const ext = f.toLowerCase();
      return (
        ext.endsWith('.jpg') ||
        ext.endsWith('.jpeg') ||
        ext.endsWith('.nef') ||
        ext.endsWith('.raw') ||
        ext.endsWith('.cr2') ||
        ext.endsWith('.arw') ||
        ext.endsWith('.dng')
      );
    });

    if (imageFiles.length === 0) return;

    setIsImporting(true);

    const results = await window.electronAPI.moveFilesToProject(
      imageFiles,
      currentProject.path
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Refresh project images
    const images = await window.electronAPI.getProjectImages(currentProject.path);
    setProjectImages(images);

    setIsImporting(false);

    // Show notification
    alert(`Importado: ${successful} arquivos\n${failed > 0 ? `Falhas: ${failed}` : ''}`);
  }, [currentProject]);

  const handleOpenFolder = () => {
    if (currentProject) {
      window.electronAPI.openFolder(currentProject.path);
    }
  };

  const stats = {
    raw: projectImages.filter((i) => i.folder === 'RAW').length,
    jpg: projectImages.filter((i) => i.folder === 'JPG').length,
    edited: projectImages.filter((i) => i.folder === 'Editados').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{currentProject.name}</h2>
          <p className="text-sm text-gray-400">{currentProject.folderName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-900/50 rounded">RAW: {stats.raw}</span>
            <span className="px-2 py-1 bg-green-900/50 rounded">JPG: {stats.jpg}</span>
            <span className="px-2 py-1 bg-purple-900/50 rounded">Editados: {stats.edited}</span>
          </div>
          <button onClick={handleOpenFolder} className="btn btn-secondary">
            Abrir Pasta
          </button>
        </div>
      </div>

      <FilterBar onFilterChange={handleFilterChange} />
      <TagFilter onFilterChange={handleTagFilterChange} />

      <DropZone onFileDrop={handleFileDrop}>
        {isLoading || isImporting ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="spinner mb-4" />
            <p className="text-gray-400">
              {isImporting ? 'Importando arquivos...' : 'Carregando...'}
            </p>
          </div>
        ) : projectImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg">Arraste imagens aqui para adicionar ao projeto</p>
          </div>
        ) : (
          <ImageGrid
            images={projectImages}
            showFolder
            projectPath={currentProject.path}
            onTagsChanged={loadTagsData}
          />
        )}
      </DropZone>
    </div>
  );
}
