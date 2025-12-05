// API URL basierend auf Umgebung
export const API_URL = process.env.REACT_APP_API_URL || 'http://10.13.51.28:5000';

// Helper für API-Aufrufe
export const apiUrl = (endpoint: string) => `${API_URL}${endpoint}`;
