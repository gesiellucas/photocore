import { useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import ImageGrid from './ImageGrid';
import FilterBar from './FilterBar';
import DropZone from './DropZone';

export default function HomeView() {
  const {
    recentImages,
    imageFilter,
    setRecentImages,
    setShowNewProjectModal,
    setPendingFiles,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = async (filter: typeof imageFilter) => {
    setIsLoading(true);
    const filterValue = filter === 'all' ? undefined : filter;
    const images = await window.electronAPI.getRecentImages(filterValue);
    setRecentImages(images);
    setIsLoading(false);
  };

  const handleFileDrop = useCallback((files: string[]) => {
    // Filter only image files
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

    if (imageFiles.length > 0) {
      setPendingFiles(imageFiles);
      setShowNewProjectModal(true);
    }
  }, []);

  const filteredImages = recentImages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Imagens Recentes</h2>
        <FilterBar onFilterChange={handleFilterChange} />
      </div>

      <DropZone onFileDrop={handleFileDrop}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">Arraste imagens aqui para criar um novo projeto</p>
            <p className="text-sm mt-2">ou clique em "Novo Projeto" na barra lateral</p>
          </div>
        ) : (
          <ImageGrid images={filteredImages} />
        )}
      </DropZone>
    </div>
  );
}
