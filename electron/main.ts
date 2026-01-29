import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { pipeline } from 'stream/promises';

let mainWindow: BrowserWindow | null = null;

// Stream-based file copy to avoid memory issues with large files
async function copyFileWithStream(src: string, dest: string): Promise<void> {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);
  await pipeline(readStream, writeStream);
}

// Get thumbnail cache directory
function getThumbnailCacheDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const cacheDir = path.join(homeDir, '.photocore_cache', 'thumbnails');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

// Generate cache key from file path and modification time
function getCacheKey(filePath: string): string {
  const stats = fs.statSync(filePath);
  const hash = crypto.createHash('md5').update(filePath + stats.mtime.getTime()).digest('hex');
  return hash + '.jpg';
}

// Extract embedded JPEG from RAW file by scanning for JPEG markers
// Finds the LARGEST embedded JPEG (the actual preview, not small thumbnails)
function extractEmbeddedJpeg(rawFilePath: string): Buffer | null {
  try {
    // Read more of the file to find the full preview (up to 10MB)
    const stats = fs.statSync(rawFilePath);
    const readSize = Math.min(stats.size, 10 * 1024 * 1024);
    const fd = fs.openSync(rawFilePath, 'r');
    const buffer = Buffer.alloc(readSize);
    const bytesRead = fs.readSync(fd, buffer, 0, readSize, 0);
    fs.closeSync(fd);

    // Find ALL JPEG segments and pick the largest one
    const jpegs: { start: number; end: number; size: number }[] = [];
    let jpegStart = -1;

    for (let i = 0; i < bytesRead - 1; i++) {
      // JPEG start marker: FFD8
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8) {
        jpegStart = i;
      }
      // JPEG end marker: FFD9
      if (jpegStart !== -1 && buffer[i] === 0xFF && buffer[i + 1] === 0xD9) {
        const jpegEnd = i + 2;
        const size = jpegEnd - jpegStart;
        // Only consider JPEGs larger than 10KB (skip tiny thumbnails)
        if (size > 10000) {
          jpegs.push({ start: jpegStart, end: jpegEnd, size });
        }
        jpegStart = -1; // Reset to find next JPEG
      }
    }

    if (jpegs.length === 0) {
      return null;
    }

    // Get the largest JPEG
    const largest = jpegs.reduce((max, curr) => curr.size > max.size ? curr : max);
    return buffer.slice(largest.start, largest.end);
  } catch (error) {
    console.error('Error extracting embedded JPEG:', error);
    return null;
  }
}

// Extract thumbnail from RAW file
async function extractThumbnail(rawFilePath: string): Promise<string | null> {
  const cacheDir = getThumbnailCacheDir();
  const cacheKey = getCacheKey(rawFilePath);
  const cachedPath = path.join(cacheDir, cacheKey);

  // Return cached thumbnail if exists
  if (fs.existsSync(cachedPath)) {
    return cachedPath;
  }

  try {
    // Extract embedded JPEG from RAW file
    const jpeg = extractEmbeddedJpeg(rawFilePath);

    if (jpeg && jpeg.length > 0) {
      fs.writeFileSync(cachedPath, jpeg);
      return cachedPath;
    }

    return null;
  } catch (error) {
    console.error('[Extract] Error:', error);
    return null;
  }
}
let driveWatcher: NodeJS.Timeout | null = null;
let knownDrives: Set<string> = new Set();

const isDev = !app.isPackaged;

// Disable sandbox on Linux in development to avoid permission issues
if (process.platform === 'linux' && isDev) {
  app.commandLine.appendSwitch('no-sandbox');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local file:// images
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Utility to convert string to PascalCase
function toPascalCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Get current date formatted
function getDatePrefix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

// Get projects directory
function getProjectsDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const projectsDir = path.join(homeDir, 'PhotoCore_Projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }
  return projectsDir;
}

// Get global tags file path
function getGlobalTagsPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(homeDir, '.photocore_tags.json');
}

// Read global tags
function readGlobalTags(): string[] {
  const tagsPath = getGlobalTagsPath();
  if (fs.existsSync(tagsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
      return data.tags || [];
    } catch {
      return [];
    }
  }
  return [];
}

// Write global tags
function writeGlobalTags(tags: string[]): void {
  const tagsPath = getGlobalTagsPath();
  fs.writeFileSync(tagsPath, JSON.stringify({ tags }, null, 2));
}

// Read project metadata (with image tags)
function readProjectMetadata(projectPath: string): any {
  const metadataPath = path.join(projectPath, '.photocore.json');
  if (fs.existsSync(metadataPath)) {
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Write project metadata
function writeProjectMetadata(projectPath: string, metadata: any): void {
  const metadataPath = path.join(projectPath, '.photocore.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// Create project folder structure
ipcMain.handle('create-project', async (_event, eventName: string, template: string) => {
  const pascalName = toPascalCase(eventName);
  const folderName = `${getDatePrefix()}_${pascalName}`;
  const projectsDir = getProjectsDir();
  const projectPath = path.join(projectsDir, folderName);

  if (fs.existsSync(projectPath)) {
    return { success: false, error: 'Projeto já existe' };
  }

  try {
    fs.mkdirSync(projectPath, { recursive: true });

    if (template === 'default') {
      fs.mkdirSync(path.join(projectPath, 'RAW'));
      fs.mkdirSync(path.join(projectPath, 'JPG'));
      fs.mkdirSync(path.join(projectPath, 'Editados'));
    }

    // Create project metadata
    const metadata = {
      name: eventName,
      pascalName,
      createdAt: new Date().toISOString(),
      template,
    };
    fs.writeFileSync(
      path.join(projectPath, '.photocore.json'),
      JSON.stringify(metadata, null, 2)
    );

    return { success: true, path: projectPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Move files to project - with progress reporting
ipcMain.handle('move-files-to-project', async (_event, files: string[], projectPath: string) => {
  const results: { file: string; success: boolean; destination?: string; error?: string }[] = [];
  const total = files.length;
  let completed = 0;

  for (const filePath of files) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);
      let destFolder: string;

      if (['.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
        destFolder = 'RAW';
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        destFolder = 'JPG';
      } else {
        results.push({ file: filePath, success: false, error: 'Formato não suportado' });
        continue;
      }

      const destPath = path.join(projectPath, destFolder, fileName);

      // Check if file already exists
      if (fs.existsSync(destPath)) {
        results.push({ file: filePath, success: false, error: 'Arquivo já existe' });
        continue;
      }

      // Use stream-based copy to avoid memory issues
      await copyFileWithStream(filePath, destPath);

      completed++;
      // Send progress update
      if (mainWindow) {
        mainWindow.webContents.send('import-progress', { completed, total, currentFile: fileName });
      }

      results.push({ file: filePath, success: true, destination: destPath });
    } catch (error) {
      results.push({ file: filePath, success: false, error: String(error) });
    }
  }

  return results;
});

// Get all projects
ipcMain.handle('get-projects', async () => {
  const projectsDir = getProjectsDir();
  const projects: any[] = [];

  try {
    const folders = fs.readdirSync(projectsDir);

    for (const folder of folders) {
      const folderPath = path.join(projectsDir, folder);
      const metadataPath = path.join(folderPath, '.photocore.json');

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        const stats = fs.statSync(folderPath);

        projects.push({
          ...metadata,
          path: folderPath,
          folderName: folder,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error reading projects:', error);
  }

  return projects.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

// Get images from a project
ipcMain.handle('get-project-images', async (_event, projectPath: string, filter?: string) => {
  const images: any[] = [];
  const folders = filter ? [filter] : ['RAW', 'JPG', 'Editados'];

  for (const folder of folders) {
    const folderPath = path.join(projectPath, folder);

    if (!fs.existsSync(folderPath)) continue;

    try {
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const ext = path.extname(file).toLowerCase();

        if (['.jpg', '.jpeg', '.png', '.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
          const stats = fs.statSync(filePath);
          images.push({
            name: file,
            path: filePath,
            folder,
            extension: ext,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(`Error reading folder ${folder}:`, error);
    }
  }

  return images.sort((a, b) =>
    new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );
});

// Get all recent images across all projects
ipcMain.handle('get-recent-images', async (_event, filter?: string, limit = 50) => {
  const projects = await ipcMain.emit('get-projects');
  const projectsDir = getProjectsDir();
  const allImages: any[] = [];

  try {
    const folders = fs.readdirSync(projectsDir);

    for (const folder of folders) {
      const folderPath = path.join(projectsDir, folder);
      const metadataPath = path.join(folderPath, '.photocore.json');

      if (fs.existsSync(metadataPath)) {
        const subFolders = filter ? [filter] : ['RAW', 'JPG', 'Editados'];

        for (const subFolder of subFolders) {
          const subFolderPath = path.join(folderPath, subFolder);

          if (!fs.existsSync(subFolderPath)) continue;

          const files = fs.readdirSync(subFolderPath);

          for (const file of files) {
            const filePath = path.join(subFolderPath, file);
            const ext = path.extname(file).toLowerCase();

            if (['.jpg', '.jpeg', '.png', '.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
              const stats = fs.statSync(filePath);
              allImages.push({
                name: file,
                path: filePath,
                projectFolder: folder,
                folder: subFolder,
                extension: ext,
                size: stats.size,
                modifiedAt: stats.mtime.toISOString(),
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading recent images:', error);
  }

  return allImages
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
    .slice(0, limit);
});

// Move file to Editados folder
ipcMain.handle('move-to-edited', async (_event, filePath: string) => {
  try {
    const dir = path.dirname(filePath);
    const projectDir = path.dirname(dir);
    const editedDir = path.join(projectDir, 'Editados');
    const fileName = path.basename(filePath);

    if (!fs.existsSync(editedDir)) {
      fs.mkdirSync(editedDir, { recursive: true });
    }

    const destPath = path.join(editedDir, fileName);
    await copyFileWithStream(filePath, destPath);

    return { success: true, path: destPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Check for memory cards - Linux and Windows compatible
async function getRemovableDrives(): Promise<string[]> {
  const drives: string[] = [];

  if (process.platform === 'linux') {
    // Check common mount points on Linux
    const mountPoints = ['/media', '/mnt', '/run/media'];

    for (const mountPoint of mountPoints) {
      if (fs.existsSync(mountPoint)) {
        try {
          const users = fs.readdirSync(mountPoint);
          for (const user of users) {
            const userPath = path.join(mountPoint, user);
            if (fs.statSync(userPath).isDirectory()) {
              const mounts = fs.readdirSync(userPath);
              for (const mount of mounts) {
                drives.push(path.join(userPath, mount));
              }
            }
          }
        } catch (e) {
          // Permission denied or not accessible
        }
      }
    }

    // Also check /mnt directly
    if (fs.existsSync('/mnt')) {
      try {
        const mounts = fs.readdirSync('/mnt');
        for (const mount of mounts) {
          const mountPath = path.join('/mnt', mount);
          if (fs.statSync(mountPath).isDirectory()) {
            drives.push(mountPath);
          }
        }
      } catch (e) {}
    }
  } else if (process.platform === 'win32') {
    // Check Windows drive letters
    for (let i = 68; i <= 90; i++) { // D: to Z:
      const driveLetter = `${String.fromCharCode(i)}:\\`;
      if (fs.existsSync(driveLetter)) {
        drives.push(driveLetter);
      }
    }
  }

  return drives;
}

// Check if drive has DCIM folder
function hasDCIMFolder(drivePath: string): string | null {
  const dcimPath = path.join(drivePath, 'DCIM');
  if (fs.existsSync(dcimPath) && fs.statSync(dcimPath).isDirectory()) {
    return dcimPath;
  }
  return null;
}

// Get all images from DCIM folder recursively
function getImagesFromDCIM(dcimPath: string): string[] {
  const images: string[] = [];

  function scanDir(dir: string) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          scanDir(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (['.jpg', '.jpeg', '.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
            images.push(itemPath);
          }
        }
      }
    } catch (e) {
      console.error('Error scanning directory:', e);
    }
  }

  scanDir(dcimPath);
  return images;
}

// Watch for new drives
function startDriveWatcher() {
  if (driveWatcher) return;

  // Initial scan
  getRemovableDrives().then(drives => {
    drives.forEach(d => knownDrives.add(d));
  });

  driveWatcher = setInterval(async () => {
    const currentDrives = await getRemovableDrives();

    for (const drive of currentDrives) {
      if (!knownDrives.has(drive)) {
        knownDrives.add(drive);

        // Check for DCIM folder
        const dcimPath = hasDCIMFolder(drive);
        if (dcimPath && mainWindow) {
          const images = getImagesFromDCIM(dcimPath);
          if (images.length > 0) {
            mainWindow.webContents.send('card-detected', {
              drive,
              dcimPath,
              imageCount: images.length,
              images: images.slice(0, 10), // Send first 10 as preview
            });
          }
        }
      }
    }

    // Remove drives that are no longer present
    for (const drive of knownDrives) {
      if (!currentDrives.includes(drive)) {
        knownDrives.delete(drive);
      }
    }
  }, 2000);
}

// Import from memory card
ipcMain.handle('import-from-card', async (_event, dcimPath: string, projectPath: string) => {
  const images = getImagesFromDCIM(dcimPath);
  const results: { file: string; success: boolean; error?: string }[] = [];
  const total = images.length;
  let completed = 0;

  for (const imagePath of images) {
    try {
      const ext = path.extname(imagePath).toLowerCase();
      const fileName = path.basename(imagePath);
      let destFolder: string;

      if (['.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
        destFolder = 'RAW';
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        destFolder = 'JPG';
      } else {
        continue;
      }

      const destPath = path.join(projectPath, destFolder, fileName);

      // Check if file already exists
      if (fs.existsSync(destPath)) {
        results.push({ file: imagePath, success: false, error: 'Arquivo já existe' });
        continue;
      }

      await copyFileWithStream(imagePath, destPath);
      completed++;

      // Send progress update
      if (mainWindow) {
        mainWindow.webContents.send('import-progress', { completed, total, currentFile: fileName });
      }

      results.push({ file: imagePath, success: true });
    } catch (error) {
      results.push({ file: imagePath, success: false, error: String(error) });
    }
  }

  return results;
});

// Get DCIM images for preview
ipcMain.handle('get-dcim-images', async (_event, dcimPath: string) => {
  return getImagesFromDCIM(dcimPath);
});

// Get thumbnail for RAW file
ipcMain.handle('get-thumbnail', async (_event, filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();

  // For JPEG files, return the file path directly
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    return filePath;
  }

  // For RAW files, extract or return cached thumbnail
  if (['.nef', '.raw', '.cr2', '.arw', '.dng'].includes(ext)) {
    return await extractThumbnail(filePath);
  }

  return null;
});

// Open folder in file manager
ipcMain.handle('open-folder', async (_event, folderPath: string) => {
  const { shell } = require('electron');
  shell.openPath(folderPath);
});

// Show save dialog
ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Selecione a pasta para salvar os projetos',
  });
  return result.filePaths[0] || null;
});

// === TAG MANAGEMENT ===

// Get all global tags
ipcMain.handle('get-global-tags', async () => {
  return readGlobalTags();
});

// Add a global tag
ipcMain.handle('add-global-tag', async (_event, tag: string) => {
  try {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) {
      return { success: false, error: 'Tag não pode estar vazia' };
    }
    const tags = readGlobalTags();
    if (!tags.includes(normalizedTag)) {
      tags.push(normalizedTag);
      tags.sort();
      writeGlobalTags(tags);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Remove a global tag
ipcMain.handle('remove-global-tag', async (_event, tag: string) => {
  try {
    const normalizedTag = tag.trim().toLowerCase();
    const tags = readGlobalTags();
    const index = tags.indexOf(normalizedTag);
    if (index > -1) {
      tags.splice(index, 1);
      writeGlobalTags(tags);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Get tags for a specific image
ipcMain.handle('get-image-tags', async (_event, projectPath: string, imageName: string) => {
  const metadata = readProjectMetadata(projectPath);
  const imageTags = metadata.imageTags || {};
  const tagsString = imageTags[imageName] || '';
  return tagsString ? tagsString.split(',').map((t: string) => t.trim()) : [];
});

// Add tag to an image
ipcMain.handle('add-image-tag', async (_event, projectPath: string, imageName: string, tag: string) => {
  try {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) {
      return { success: false, error: 'Tag não pode estar vazia' };
    }

    const metadata = readProjectMetadata(projectPath);
    if (!metadata.imageTags) {
      metadata.imageTags = {};
    }

    const currentTags = metadata.imageTags[imageName]
      ? metadata.imageTags[imageName].split(',').map((t: string) => t.trim())
      : [];

    if (!currentTags.includes(normalizedTag)) {
      currentTags.push(normalizedTag);
      metadata.imageTags[imageName] = currentTags.join(',');
      writeProjectMetadata(projectPath, metadata);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Remove tag from an image
ipcMain.handle('remove-image-tag', async (_event, projectPath: string, imageName: string, tag: string) => {
  try {
    const normalizedTag = tag.trim().toLowerCase();
    const metadata = readProjectMetadata(projectPath);

    if (!metadata.imageTags || !metadata.imageTags[imageName]) {
      return { success: true };
    }

    const currentTags = metadata.imageTags[imageName]
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t !== normalizedTag);

    if (currentTags.length > 0) {
      metadata.imageTags[imageName] = currentTags.join(',');
    } else {
      delete metadata.imageTags[imageName];
    }

    writeProjectMetadata(projectPath, metadata);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Get all image tags for a project (returns map of imageName -> tags string)
ipcMain.handle('get-project-image-tags', async (_event, projectPath: string) => {
  const metadata = readProjectMetadata(projectPath);
  return metadata.imageTags || {};
});

app.whenReady().then(() => {
  createWindow();
  startDriveWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (driveWatcher) {
    clearInterval(driveWatcher);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
