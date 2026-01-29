import { useAppStore } from '../stores/appStore';

interface TagFilterProps {
  onFilterChange: () => void;
}

export default function TagFilter({ onFilterChange }: TagFilterProps) {
  const { globalTags, selectedTags, setSelectedTags } = useAppStore();

  const handleTagClick = (tag: string) => {
    let newTags: string[];
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter((t) => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    onFilterChange();
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    onFilterChange();
  };

  if (globalTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400">Tags:</span>
      {globalTags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {tag}
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button
          onClick={handleClearAll}
          className="px-2 py-1 text-sm text-gray-400 hover:text-white"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
