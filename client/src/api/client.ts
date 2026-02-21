export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to handle the actual fetch logic
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> => {
    const { headers, body, ...rest } = options;
    const configHeaders: HeadersInit = { ...headers };

    let configBody: BodyInit | null | undefined = body as BodyInit;

    // 1. Auto-detect JSON vs FormData
    if (body && !(body instanceof FormData)) { 
        (configHeaders as Record<string, string>)['Content-Type'] = 'application/json';
        configBody = JSON.stringify(body);
    } 

    // 2. Make the Request
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...rest,
        headers: configHeaders,
        body: configBody,
    });

    // 3. Global Error Handler
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    // 4. Return in "Axios Style" ({ data: ... }) 
    const data = await response.json();
    return { data };
};

// Export the object with methods
export const apiClient = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    
    post: <T, B extends object = Record<string, unknown>>(url: string, body?: B, options: RequestInit = {}) => 
        request<T>(url, { method: 'POST', body: body as unknown as BodyInit, ...options }),
    
    put: <T, B extends object = Record<string, unknown>>(url: string, body?: B, options: RequestInit = {}) => 
        request<T>(url, { method: 'PUT', body: body as unknown as BodyInit, ...options }),
    
    patch: <T, B extends object = Record<string, unknown>>(url: string, body?: B, options: RequestInit = {}) => 
        request<T>(url, { method: 'PATCH', body: body as unknown as BodyInit, ...options }),
    
    delete: <T>(url: string, options: RequestInit = {}) => 
        request<T>(url, { method: 'DELETE', ...options }),
};