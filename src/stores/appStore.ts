import { create } from 'zustand';
import type { Project, ImageFile, ImageFilter, CardDetectionData, ImportProgress, ImageTagsMap } from '../types';

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;

  // Images
  recentImages: ImageFile[];
  projectImages: ImageFile[];
  imageFilter: ImageFilter;
  setRecentImages: (images: ImageFile[]) => void;
  setProjectImages: (images: ImageFile[]) => void;
  setImageFilter: (filter: ImageFilter) => void;

  // Card detection
  detectedCard: CardDetectionData | null;
  setDetectedCard: (card: CardDetectionData | null) => void;

  // UI State
  isCreatingProject: boolean;
  isImporting: boolean;
  showNewProjectModal: boolean;
  showCardModal: boolean;
  pendingFiles: string[];
  importProgress: ImportProgress | null;
  setIsCreatingProject: (value: boolean) => void;
  setIsImporting: (value: boolean) => void;
  setShowNewProjectModal: (value: boolean) => void;
  setShowCardModal: (value: boolean) => void;
  setPendingFiles: (files: string[]) => void;
  setImportProgress: (progress: ImportProgress | null) => void;

  // View
  currentView: 'home' | 'project';
  setCurrentView: (view: 'home' | 'project') => void;

  // Tags
  globalTags: string[];
  selectedTags: string[];
  projectImageTags: ImageTagsMap;
  setGlobalTags: (tags: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setProjectImageTags: (tags: ImageTagsMap) => void;
  showTagManager: boolean;
  setShowTagManager: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),

  // Images
  recentImages: [],
  projectImages: [],
  imageFilter: 'all',
  setRecentImages: (recentImages) => set({ recentImages }),
  setProjectImages: (projectImages) => set({ projectImages }),
  setImageFilter: (imageFilter) => set({ imageFilter }),

  // Card detection
  detectedCard: null,
  setDetectedCard: (detectedCard) => set({ detectedCard }),

  // UI State
  isCreatingProject: false,
  isImporting: false,
  showNewProjectModal: false,
  showCardModal: false,
  pendingFiles: [],
  importProgress: null,
  setIsCreatingProject: (isCreatingProject) => set({ isCreatingProject }),
  setIsImporting: (isImporting) => set({ isImporting }),
  setShowNewProjectModal: (showNewProjectModal) => set({ showNewProjectModal }),
  setShowCardModal: (showCardModal) => set({ showCardModal }),
  setPendingFiles: (pendingFiles) => set({ pendingFiles }),
  setImportProgress: (importProgress) => set({ importProgress }),

  // View
  currentView: 'home',
  setCurrentView: (currentView) => set({ currentView }),

  // Tags
  globalTags: [],
  selectedTags: [],
  projectImageTags: {},
  setGlobalTags: (globalTags) => set({ globalTags }),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
  setProjectImageTags: (projectImageTags) => set({ projectImageTags }),
  showTagManager: false,
  setShowTagManager: (showTagManager) => set({ showTagManager }),
}));
