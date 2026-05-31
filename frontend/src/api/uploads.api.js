import apiClient from './client';

export const uploadsApi = {
  uploadProductImage: (formData) =>
    apiClient.post('/uploads/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
