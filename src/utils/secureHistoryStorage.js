/**
 * Secure History Storage
 * Guarda resultados sin imágenes completas
 * Las imágenes se pueden regenerar o se descartan después de un tiempo
 */

const STORAGE_KEY = 'trichai_history_secure';
const LEGACY_KEY  = 'trichai_history';
const MAX_ENTRIES = 50;
const IMAGE_RETENTION_HOURS = 24; // Borrar imágenes después de 24h

export function loadSecureHistory() {
  try {
    // Migrate from legacy key (one-time, silent)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    let history = JSON.parse(data);

    // Remove image data from entries older than IMAGE_RETENTION_HOURS
    const now = Date.now();
    const maxAge = IMAGE_RETENTION_HOURS * 3600 * 1000;
    let dirty = false;

    history = history.map(entry => {
      if (entry.imageData && entry.timestamp && (now - entry.timestamp) > maxAge) {
        dirty = true;
        const { imageData: _, ...rest } = entry;
        return rest;
      }
      return entry;
    });

    if (dirty) saveSecureHistory(history);

    return history;
  } catch (error) {
    console.warn('Error loading secure history:', error);
    return [];
  }
}

export function saveSecureHistory(history) {
  try {
    // Limit to MAX_ENTRIES, keep newest
    const limited = history.slice(-MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Storage full - remove oldest images
      console.warn('Storage quota exceeded, removing old images...');
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

      for (let i = 0; i < history.length; i++) {
        if (history[i].imageData) {
          delete history[i].imageData;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            return true;
          } catch {
            // Continue trying
          }
        }
      }

      // If still full, remove oldest entry
      if (history.length > 0) {
        history.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      }
    } else {
      console.error('Error saving secure history:', error);
    }
    return false;
  }
}

export function addToSecureHistory(result, imageData = null) {
  const history = loadSecureHistory();

  const entry = {
    id: Date.now(),
    timestamp: Date.now(),
    date: new Date().toLocaleString('es-ES'),
    result: result,
    // IMPORTANTE: Imagedata es opcional y se borra después de 24 horas
    imageData: imageData ? imageData.substring(0, 100000) : null, // Limitar a 100KB
  };

  history.push(entry);
  saveSecureHistory(history);

  return entry;
}

export function clearSecureHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

export function removeFromSecureHistory(entryId) {
  const history = loadSecureHistory();
  const filtered = history.filter(e => e.id !== entryId);
  saveSecureHistory(filtered);
}

export function clearOldImages() {
  const history = loadSecureHistory();
  const now = Date.now();
  const maxAge = IMAGE_RETENTION_HOURS * 3600 * 1000;

  history.forEach(entry => {
    if ((now - entry.timestamp) > maxAge && entry.imageData) {
      delete entry.imageData;
    }
  });

  saveSecureHistory(history);
}
