import { apiRequest } from "./queryClient";

export async function uploadSchoolFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiRequest('POST', '/api/schools', formData);
  return response.json();
}

export async function getGeographicData() {
  const response = await apiRequest('GET', '/api/geographic');
  return response.json();
}

export async function getSchools(filters: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        params.append(key, value.join(','));
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  const response = await apiRequest('GET', `/api/schools?${params}`);
  return response.json();
}

export async function startScan(schoolIds: number[]) {
  const response = await apiRequest('POST', '/api/scan', { schoolIds });
  return response.json();
}

export async function getScanProgress(sessionId: number) {
  const response = await apiRequest('GET', `/api/scan/${sessionId}`);
  return response.json();
}

export async function getTenders(filters: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        params.append(key, value.join(','));
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  const response = await apiRequest('GET', `/api/tenders?${params}`);
  return response.json();
}
