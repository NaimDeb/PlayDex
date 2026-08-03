import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminService from './adminService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../authUtils', () => ({
  default: {
    getAuthorization: () => ({
      headers: { Authorization: 'Bearer testtoken' },
    }),
  },
}));

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getReports fetches with pagination, search and entity filter', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [], totalItems: 0 },
    });

    await adminService.getReports(2);
    expect(apiClient.get).toHaveBeenCalledWith('/reports?page=2', expect.any(Object));

    vi.clearAllMocks();
    await adminService.getReports(1, 'spam', 'Patchnote');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/reports?page=1&q=spam&reportableEntity=Patchnote',
      expect.any(Object)
    );
  });

  it('getPatchnotes forwards search, importance and admin page size', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [], totalItems: 0 },
    });

    await adminService.getPatchnotes(3, 'zelda', 'hotfix');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/patchnotes?page=3&q=zelda&importance=hotfix&itemsPerPage=10&isDeleted=false',
      expect.any(Object)
    );
  });

  it('getModifications uses admin endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [], totalItems: 0 },
    });

    await adminService.getModifications(1);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/modifications?page=1', expect.any(Object));
  });

  it('banUser sends ban data to correct endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    await adminService.banUser(5, { banReason: 'spam' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/5/ban',
      { banReason: 'spam' },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });

  it('unbanUser sends POST to unban endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    await adminService.unbanUser(5);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/5/unban',
      {},
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });
});
