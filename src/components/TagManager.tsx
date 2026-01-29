import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export default function TagManager() {
  const { globalTags, setGlobalTags, showTagManager, setShowTagManager } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const tags = await window.electronAPI.getGlobalTags();
    setGlobalTags(tags);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    setIsLoading(true);
    const result = await window.electronAPI.addGlobalTag(newTag);
    if (result.success) {
      await loadTags();
      setNewTag('');
    }
    setIsLoading(false);
  };

  const handleRemoveTag = async (tag: string) => {
    setIsLoading(true);
    const result = await window.electronAPI.removeGlobalTag(tag);
    if (result.success) {
      await loadTags();
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  if (!showTagManager) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Gerenciar Tags</h2>
          <button
            onClick={() => setShowTagManager(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nova tag..."
            className="flex-1 bg-[#0f0f1a] border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            disabled={isLoading}
          />
          <button
            onClick={handleAddTag}
            disabled={isLoading || !newTag.trim()}
            className="btn btn-primary px-4"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {globalTags.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma tag criada</p>
          ) : (
            globalTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center justify-between bg-[#0f0f1a] rounded px-3 py-2"
              >
                <span className="text-white">{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isLoading}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Tags globais ficam disponíveis em todos os projetos
        </p>
      </div>
    </div>
  );
}
