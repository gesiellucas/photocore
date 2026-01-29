import { useState, useEffect } from 'react';
import type { ImageFile } from '../types';
import { useAppStore } from '../stores/appStore';
import ImageTagEditor from './ImageTagEditor';

interface ImageGridProps {
  images: ImageFile[];
  showFolder?: boolean;
  projectPath?: string;
  onTagsChanged?: () => void;
}

// Individual image card with thumbnail loading
function ImageCard({
  image,
  showFolder,
  projectPath,
  onTagClick,
}: {
  image: ImageFile;
  showFolder: boolean;
  projectPath?: string;
  onTagClick?: (image: ImageFile) => void;
}) {
  const { projectImageTags } = useAppStore();
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get tags for this image from the store
  const tagsString = projectImageTags[image.name] || '';
  const imageTags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFolderColor = (folder: string) => {
    switch (folder) {
      case 'RAW':
        return 'bg-blue-600';
      case 'JPG':
        return 'bg-green-600';
      case 'Editados':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadThumbnail = async () => {
      console.log('[ImageCard] Loading thumbnail for:', image.path);
      setIsLoading(true);
      try {
        console.log('[ImageCard] Calling getThumbnail API...');
        const thumbPath = await window.electronAPI.getThumbnail(image.path);
        console.log('[ImageCard] Got thumbnail path:', thumbPath);
        if (isMounted && thumbPath) {
          const src = `file://${thumbPath}`;
          console.log('[ImageCard] Setting src:', src);
          setThumbnailSrc(src);
        }
      } catch (error) {
        console.error('[ImageCard] Error loading thumbnail:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
    };
  }, [image.path]);

  const handleClick = () => {
    window.electronAPI.openFolder(image.path.replace(/[^/\\]+$/, ''));
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTagClick && projectPath) {
      onTagClick(image);
    }
  };

  return (
    <div className="image-card" onClick={handleClick}>
      {isLoading ? (
        <div className="raw-placeholder">
          <div className="spinner" />
        </div>
      ) : thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={image.name}
          loading="lazy"
          onError={() => setThumbnailSrc(null)}
        />
      ) : (
        <div className="raw-placeholder">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-mono">{image.extension.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Tag button */}
      {projectPath && (
        <button
          onClick={handleTagClick}
          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded hover:bg-purple-600 transition-colors"
          title="Editar tags"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>
      )}

      <div className="info">
        <p className="font-medium truncate text-white" title={image.name}>
          {image.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{formatSize(image.size)}</span>
          {showFolder && (
            <span className={`text-xs px-2 py-0.5 rounded ${getFolderColor(image.folder)} text-white`}>
              {image.folder}
            </span>
          )}
        </div>
        {/* Image tags */}
        {imageTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {imageTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-purple-600/50 rounded text-purple-200">
                {tag}
              </span>
            ))}
            {imageTags.length > 3 && (
              <span className="text-xs text-gray-400">+{imageTags.length - 3}</span>
            )}
          </div>
        )}
        {image.projectFolder && (
          <p className="text-xs text-gray-500 truncate mt-1">{image.projectFolder}</p>
        )}
      </div>
    </div>
  );
}

export default function ImageGrid({ images, showFolder = false, projectPath, onTagsChanged }: ImageGridProps) {
  const [editingImage, setEditingImage] = useState<ImageFile | null>(null);

  console.log('[ImageGrid] Rendering with', images.length, 'images');

  const handleTagClick = (image: ImageFile) => {
    setEditingImage(image);
  };

  const handleTagEditorClose = () => {
    setEditingImage(null);
  };

  const handleTagsChanged = () => {
    if (onTagsChanged) {
      onTagsChanged();
    }
  };

  return (
    <>
      <div className="image-grid">
        {images.map((image) => (
          <ImageCard
            key={image.path}
            image={image}
            showFolder={showFolder}
            projectPath={projectPath}
            onTagClick={handleTagClick}
          />
        ))}
      </div>

      {editingImage && projectPath && (
        <ImageTagEditor
          image={editingImage}
          projectPath={projectPath}
          onClose={handleTagEditorClose}
          onTagsChanged={handleTagsChanged}
        />
      )}
    </>
  );
}
