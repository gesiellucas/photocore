import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Project management
  createProject: (eventName: string, template: string) =>
    ipcRenderer.invoke('create-project', eventName, template),

  getProjects: () =>
    ipcRenderer.invoke('get-projects'),

  getProjectImages: (projectPath: string, filter?: string) =>
    ipcRenderer.invoke('get-project-images', projectPath, filter),

  getRecentImages: (filter?: string, limit?: number) =>
    ipcRenderer.invoke('get-recent-images', filter, limit),

  // File operations
  moveFilesToProject: (files: string[], projectPath: string) =>
    ipcRenderer.invoke('move-files-to-project', files, projectPath),

  moveToEdited: (filePath: string) =>
    ipcRenderer.invoke('move-to-edited', filePath),

  // Memory card operations
  onCardDetected: (callback: (data: any) => void) => {
    ipcRenderer.on('card-detected', (_event, data) => callback(data));
  },

  removeCardDetectedListener: () => {
    ipcRenderer.removeAllListeners('card-detected');
  },

  // Progress tracking
  onImportProgress: (callback: (data: { completed: number; total: number; currentFile: string }) => void) => {
    ipcRenderer.on('import-progress', (_event, data) => callback(data));
  },

  removeImportProgressListener: () => {
    ipcRenderer.removeAllListeners('import-progress');
  },

  importFromCard: (dcimPath: string, projectPath: string) =>
    ipcRenderer.invoke('import-from-card', dcimPath, projectPath),

  getDCIMImages: (dcimPath: string) =>
    ipcRenderer.invoke('get-dcim-images', dcimPath),

  // Utilities
  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('open-folder', folderPath),

  showSaveDialog: () =>
    ipcRenderer.invoke('show-save-dialog'),

  // Thumbnail extraction for RAW files
  getThumbnail: (filePath: string) =>
    ipcRenderer.invoke('get-thumbnail', filePath),

  // Tag management
  getGlobalTags: () =>
    ipcRenderer.invoke('get-global-tags'),

  addGlobalTag: (tag: string) =>
    ipcRenderer.invoke('add-global-tag', tag),

  removeGlobalTag: (tag: string) =>
    ipcRenderer.invoke('remove-global-tag', tag),

  getImageTags: (projectPath: string, imageName: string) =>
    ipcRenderer.invoke('get-image-tags', projectPath, imageName),

  addImageTag: (projectPath: string, imageName: string, tag: string) =>
    ipcRenderer.invoke('add-image-tag', projectPath, imageName, tag),

  removeImageTag: (projectPath: string, imageName: string, tag: string) =>
    ipcRenderer.invoke('remove-image-tag', projectPath, imageName, tag),

  getProjectImageTags: (projectPath: string) =>
    ipcRenderer.invoke('get-project-image-tags', projectPath),
});
