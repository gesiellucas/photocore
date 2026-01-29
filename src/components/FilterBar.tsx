import { useState } from 'react';
import type { ImageFilter } from '../types';

interface FilterBarProps {
  onFilterChange: (filter: ImageFilter) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState<ImageFilter>('all');

  const filters: { value: ImageFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'RAW', label: 'RAW' },
    { value: 'JPG', label: 'JPG' },
    { value: 'Editados', label: 'Editados' },
  ];

  const handleClick = (filter: ImageFilter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleClick(filter.value)}
          className={`filter-chip ${activeFilter === filter.value ? 'active' : ''}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
