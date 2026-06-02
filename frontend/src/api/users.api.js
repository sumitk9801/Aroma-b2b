import apiClient from './client';

export const usersApi = {
  // GET /users?shopId=<id>
  getAll: (params = {}) =>
    apiClient.get('/users', { params }),

  getById: (id) =>
    apiClient.get(`/users/${id}`),

  // POST /users — body includes shopId
  create: (data) =>
    apiClient.post('/users', data),

  // PATCH /users/:id
  update: (id, data) =>
    apiClient.patch(`/users/${id}`, data),

  // DELETE /users/:id?shopId=<id>
  delete: (id, shopId) =>
    apiClient.delete(`/users/${id}`, { params: shopId ? { shopId } : {} }),
};
