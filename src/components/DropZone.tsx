import { useCallback, useState, type ReactNode, type DragEvent } from 'react';

interface DropZoneProps {
  children: ReactNode;
  onFileDrop: (files: string[]) => void;
}

export default function DropZone({ children, onFileDrop }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).map((f) => (f as File & { path: string }).path);
    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [onFileDrop]);

  return (
    <div
      className={`drop-zone min-h-[400px] p-6 ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver ? (
        <div className="flex flex-col items-center justify-center h-64 text-app-accent">
          <svg className="w-16 h-16 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xl font-medium">Solte os arquivos aqui</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
