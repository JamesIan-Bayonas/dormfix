import { sessionFetch } from './session';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };
const request = async <T>(endpoint: string, options: ApiOptions = {}): Promise<{ data: T }> => {
    const { headers, body, ...rest } = options;
    const configHeaders = new Headers(headers);
    const multipart = body instanceof FormData;
    if (body != null && !multipart) configHeaders.set('Content-Type', 'application/json');
    const response = await sessionFetch(BASE_URL + endpoint, {
        ...rest, headers: configHeaders,
        body: body == null ? null : multipart ? body : JSON.stringify(body),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'HTTP Error ' + response.status);
    }
    return { data: response.status === 204 ? undefined as T : await response.json() };
};
export const apiClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body?: unknown, options: RequestInit = {}) => request<T>(url, { method: 'POST', ...options, body }),
    put: <T>(url: string, body?: unknown, options: RequestInit = {}) => request<T>(url, { method: 'PUT', ...options, body }),
    patch: <T>(url: string, body?: unknown, options: RequestInit = {}) => request<T>(url, { method: 'PATCH', ...options, body }),
    delete: <T>(url: string, options: RequestInit = {}) => request<T>(url, { method: 'DELETE', ...options }),
};
