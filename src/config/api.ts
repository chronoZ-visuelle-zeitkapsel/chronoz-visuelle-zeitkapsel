const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();

// If no explicit API URL is configured, use relative API paths.
// This enables CRA proxy in local dev and same-origin routing in deployments.
export const API_URL = configuredApiUrl || '';

export const apiUrl = (endpoint: string) => {
	if (!API_URL) return endpoint;
	return `${API_URL}${endpoint}`;
};
