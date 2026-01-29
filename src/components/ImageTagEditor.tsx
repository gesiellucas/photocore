import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import type { ImageFile } from '../types';

interface ImageTagEditorProps {
  image: ImageFile;
  projectPath: string;
  onClose: () => void;
  onTagsChanged: () => void;
}

export default function ImageTagEditor({ image, projectPath, onClose, onTagsChanged }: ImageTagEditorProps) {
  const { globalTags } = useAppStore();
  const [imageTags, setImageTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadImageTags();
  }, [image.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadImageTags = async () => {
    const tags = await window.electronAPI.getImageTags(projectPath, image.name);
    setImageTags(tags);
  };

  const handleAddTag = async (tag: string) => {
    if (imageTags.includes(tag)) return;

    setIsLoading(true);
    const result = await window.electronAPI.addImageTag(projectPath, image.name, tag);
    if (result.success) {
      await loadImageTags();
      onTagsChanged();
    }
    setIsLoading(false);
    setShowDropdown(false);
  };

  const handleRemoveTag = async (tag: string) => {
    setIsLoading(true);
    const result = await window.electronAPI.removeImageTag(projectPath, image.name, tag);
    if (result.success) {
      await loadImageTags();
      onTagsChanged();
    }
    setIsLoading(false);
  };

  const availableTags = globalTags.filter((t) => !imageTags.includes(t));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold truncate flex-1 mr-2" title={image.name}>
            Tags: {image.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current tags */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Tags da imagem:</p>
          <div className="flex flex-wrap gap-2 min-h-[40px] bg-[#0f0f1a] rounded p-2">
            {imageTags.length === 0 ? (
              <span className="text-gray-500 text-sm">Nenhuma tag</span>
            ) : (
              imageTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isLoading}
                    className="hover:text-red-200 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Add tag dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading || availableTags.length === 0}
            className="w-full btn btn-secondary flex items-center justify-between"
          >
            <span>Adicionar tag</span>
            <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && availableTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1a] border border-gray-700 rounded max-h-48 overflow-y-auto z-10">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-3 py-2 hover:bg-purple-600/20 text-white"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {availableTags.length === 0 && globalTags.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Crie tags globais primeiro no menu "Gerenciar Tags"
          </p>
        )}
      </div>
    </div>
  );
}
