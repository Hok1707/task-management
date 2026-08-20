import axios, { AxiosError } from 'axios';
import { ApiError } from '../types';

const API_URL_STORAGE_KEY = 'spring_boot_api_base_url';

export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem(API_URL_STORAGE_KEY);
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, '');
  return 'http://localhost:8080';
}

export function setApiBaseUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(API_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Update baseURL and attach auth credentials dynamically per request
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  const metaEnv = (import.meta as any).env || {};
  const authToken = metaEnv.VITE_AUTH_TOKEN;
  const apiKey = metaEnv.VITE_API_KEY;

  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (apiKey && !config.headers['X-API-Key']) {
    config.headers['X-API-Key'] = apiKey;
  }

  return config;
});

// Response interceptor to handle Spring Boot ApiError DTOs
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response && error.response.data) {
      const apiErr = error.response.data;
      if (apiErr.message || apiErr.error) {
        let formattedMessage = apiErr.message || apiErr.error;

        // If field validation errors are present
        if (apiErr.fieldErrors && apiErr.fieldErrors.length > 0) {
          const validationDetails = apiErr.fieldErrors
            .map((fe) => `${fe.field}: ${fe.message}`)
            .join(', ');
          formattedMessage = `${formattedMessage} (${validationDetails})`;
        }

        const customErr = new Error(`[Spring Boot ${apiErr.status || error.response.status}] ${formattedMessage}`);
        (customErr as any).apiError = apiErr;
        (customErr as any).status = apiErr.status || error.response.status;
        return Promise.reject(customErr);
      }
    }
    return Promise.reject(error);
  }
);
