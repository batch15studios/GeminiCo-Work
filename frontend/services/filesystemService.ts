import { WorkspaceFile } from '../types';

export interface FsListResponse {
  root: string;
  workspaceRoot: string;
  items: Array<{
    id: string;
    name: string;
    path: string;
    relativePath: string;
    isDirectory: boolean;
    size: number;
    extension: string;
  }>;
}

export const fetchWorkspaceFiles = async (dirPath?: string): Promise<FsListResponse> => {
  const query = dirPath ? `?dir=${encodeURIComponent(dirPath)}` : '';
  const res = await fetch(`/api/fs/list${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch files (HTTP ${res.status})`);
  }
  return res.json();
};

export const readWorkspaceFile = async (filePath: string): Promise<{ path: string; name: string; content: string; extension: string }> => {
  const res = await fetch(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to read file (HTTP ${res.status})`);
  }
  return res.json();
};

export const saveWorkspaceFile = async (filePath: string, content: string): Promise<{ success: boolean; path: string }> => {
  const res = await fetch('/api/fs/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save file (HTTP ${res.status})`);
  }
  return res.json();
};

export const createWorkspaceEntry = async (filePath: string, isDirectory: boolean): Promise<{ success: boolean; path: string }> => {
  const res = await fetch('/api/fs/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, isDirectory })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create entry (HTTP ${res.status})`);
  }
  return res.json();
};

export const deleteWorkspaceEntry = async (filePath: string): Promise<{ success: boolean; path: string }> => {
  const res = await fetch('/api/fs/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete entry (HTTP ${res.status})`);
  }
  return res.json();
};

/**
 * Fallback browser File System Access API picker for picking any local folder
 */
export const openLocalFolderWithPicker = async (): Promise<WorkspaceFile[]> => {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser. Use the native local file tree.');
  }

  const dirHandle = await (window as any).showDirectoryPicker();
  const loadedFiles: WorkspaceFile[] = [];

  async function scanDir(handle: any, currentPath: string) {
    for await (const entry of handle.values()) {
      const entryPath = `${currentPath}/${entry.name}`;
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.size < 5 * 1024 * 1024) { // 5MB limit
          const content = await file.text();
          const ext = entry.name.split('.').pop()?.toLowerCase() || '';
          loadedFiles.push({
            id: 'fs-' + Math.random().toString(36).substring(2, 9),
            name: entry.name,
            path: entryPath,
            content,
            extension: ext,
            size: file.size,
            isSelected: true
          });
        }
      } else if (entry.kind === 'directory' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        await scanDir(entry, entryPath);
      }
    }
  }

  await scanDir(dirHandle, dirHandle.name);
  return loadedFiles;
};
