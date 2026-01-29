export interface Project {
  name: string;
  pascalName: string;
  createdAt: string;
  modifiedAt: string;
  template: string;
  path: string;
  folderName: string;
}

export interface ImageFile {
  name: string;
  path: string;
  folder: string;
  projectFolder?: string;
  extension: string;
  size: number;
  modifiedAt: string;
  tags?: string[];
}

// Mapa de nome de arquivo para tags (separadas por vírgula)
export interface ImageTagsMap {
  [imageName: string]: string;
}

export interface CardDetectionData {
  drive: string;
  dcimPath: string;
  imageCount: number;
  images: string[];
}

export interface ImportResult {
  file: string;
  success: boolean;
  destination?: string;
  error?: string;
}

export interface ImportProgress {
  completed: number;
  total: number;
  currentFile: string;
}

export type ImageFilter = 'all' | 'RAW' | 'JPG' | 'Editados';

export type Template = 'default';

declare global {
  interface Window {
    electronAPI: {
      createProject: (eventName: string, template: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      getProjects: () => Promise<Project[]>;
      getProjectImages: (projectPath: string, filter?: string) => Promise<ImageFile[]>;
      getRecentImages: (filter?: string, limit?: number) => Promise<ImageFile[]>;
      moveFilesToProject: (files: string[], projectPath: string) => Promise<ImportResult[]>;
      moveToEdited: (filePath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      onCardDetected: (callback: (data: CardDetectionData) => void) => void;
      removeCardDetectedListener: () => void;
      onImportProgress: (callback: (data: ImportProgress) => void) => void;
      removeImportProgressListener: () => void;
      importFromCard: (dcimPath: string, projectPath: string) => Promise<ImportResult[]>;
      getDCIMImages: (dcimPath: string) => Promise<string[]>;
      openFolder: (folderPath: string) => Promise<void>;
      showSaveDialog: () => Promise<string | null>;
      getThumbnail: (filePath: string) => Promise<string | null>;
      // Tag management
      getGlobalTags: () => Promise<string[]>;
      addGlobalTag: (tag: string) => Promise<{ success: boolean; error?: string }>;
      removeGlobalTag: (tag: string) => Promise<{ success: boolean; error?: string }>;
      getImageTags: (projectPath: string, imageName: string) => Promise<string[]>;
      addImageTag: (projectPath: string, imageName: string, tag: string) => Promise<{ success: boolean; error?: string }>;
      removeImageTag: (projectPath: string, imageName: string, tag: string) => Promise<{ success: boolean; error?: string }>;
      getProjectImageTags: (projectPath: string) => Promise<ImageTagsMap>;
    };
  }
}
