import { UpdateInfo } from '../types';

export const checkForUpdates = async (): Promise<UpdateInfo> => {
  const res = await fetch('/api/updates/check');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update check failed (HTTP ${res.status})`);
  }
  return res.json();
};

export const pullLatestUpdate = async (): Promise<{ success: boolean; stdout?: string; stderr?: string }> => {
  const res = await fetch('/api/updates/pull', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Pull failed (HTTP ${res.status})`);
  }
  return res.json();
};
