import { GoogleWorkspaceItem } from '../types';
import { getStoredGoogleToken } from './firebaseService';

/**
 * Service to interact directly with Google Workspace REST APIs:
 * - Google Drive (v3)
 * - Google Docs (v1)
 * - Gmail (v1)
 * - Google Calendar (v3)
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface GmailMessageSummary {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface CalendarEventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  htmlLink?: string;
}

/**
 * Fetches recent files from user's Google Drive
 */
export const fetchLiveGoogleDriveFiles = async (customToken?: string): Promise<GoogleWorkspaceItem[]> => {
  const token = customToken || getStoredGoogleToken();
  if (!token) throw new Error("Google Authentication required. Please sign in with Google in Settings.");

  const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const files: GoogleDriveFile[] = data.files || [];

  return files.map(f => {
    let appType: GoogleWorkspaceItem['appType'] = 'drive';
    if (f.mimeType.includes('document')) appType = 'docs';
    else if (f.mimeType.includes('spreadsheet')) appType = 'sheets';
    else if (f.mimeType.includes('presentation')) appType = 'slides';

    return {
      id: `gdrive-${f.id}`,
      appType,
      title: f.name,
      snippet: `${f.mimeType} • Modified ${f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'recently'}`,
      content: `[Google ${appType.toUpperCase()}: ${f.name}]\nID: ${f.id}\nMimeType: ${f.mimeType}\nModified: ${f.modifiedTime || 'Recently'}\nLink: ${f.webViewLink || 'https://drive.google.com'}`,
      updatedAt: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Today',
      isSelected: false,
      url: f.webViewLink
    };
  });
};

/**
 * Fetches full text content of a Google Doc
 */
export const fetchLiveGoogleDocContent = async (docId: string, customToken?: string): Promise<string> => {
  const token = customToken || getStoredGoogleToken();
  if (!token) throw new Error("Google Authentication required.");

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Google Docs API error (${response.status})`);
  }

  const data = await response.json();
  let fullText = '';
  
  if (data.body && data.body.content) {
    for (const element of data.body.content) {
      if (element.paragraph && element.paragraph.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            fullText += el.textRun.content;
          }
        }
      }
    }
  }

  return fullText.trim() || `(Google Document "${data.title || 'Untitled'}" is empty)`;
};

/**
 * Fetches recent inbox emails from Gmail
 */
export const fetchLiveGmailMessages = async (customToken?: string): Promise<GoogleWorkspaceItem[]> => {
  const token = customToken || getStoredGoogleToken();
  if (!token) throw new Error("Google Authentication required.");

  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${err}`);
  }

  const listData = await listRes.json();
  const messages: any[] = listData.messages || [];
  const items: GoogleWorkspaceItem[] = [];

  for (const m of messages) {
    try {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        const headers: { name: string; value: string }[] = msgData.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
        const snippet = msgData.snippet || '';

        items.push({
          id: `gmail-${m.id}`,
          appType: 'gmail',
          title: `Email: ${subject}`,
          snippet: snippet || subject,
          content: `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\nSnippet:\n${snippet}`,
          updatedAt: date ? new Date(date).toLocaleDateString() : 'Recently',
          isSelected: false
        });
      }
    } catch {}
  }

  return items;
};

/**
 * Fetches upcoming events from Google Calendar
 */
export const fetchLiveCalendarEvents = async (customToken?: string): Promise<GoogleWorkspaceItem[]> => {
  const token = customToken || getStoredGoogleToken();
  if (!token) throw new Error("Google Authentication required.");

  const now = encodeURIComponent(new Date().toISOString());
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=8&singleEvents=true&orderBy=startTime`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const events: any[] = data.items || [];

  return events.map(ev => {
    const start = ev.start?.dateTime || ev.start?.date || '';
    const end = ev.end?.dateTime || ev.end?.date || '';
    const summary = ev.summary || 'Scheduled Event';
    const desc = ev.description ? `\nDescription: ${ev.description}` : '';

    return {
      id: `cal-${ev.id}`,
      appType: 'calendar',
      title: `Event: ${summary}`,
      snippet: `${start ? new Date(start).toLocaleTimeString() : 'Event'}: ${summary}`,
      content: `Event: ${summary}\nTime: ${start} to ${end}${desc}\nLink: ${ev.htmlLink || ''}`,
      updatedAt: start ? new Date(start).toLocaleDateString() : 'Upcoming',
      isSelected: false,
      url: ev.htmlLink
    };
  });
};
