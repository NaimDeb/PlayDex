import { describe, it, expect, vi, beforeEach } from 'vitest';
import reportService from './reportService';
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

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('postReport sends correct data with auth', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    await reportService.postReport({
      reason: 'spam',
      reportableId: 1,
      reportableEntity: 'Patchnote',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/reports',
      { reason: 'spam', reportableId: 1, reportableEntity: 'Patchnote' },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testtoken' }) })
    );
  });

  it('getReports fetches with pagination', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { member: [{ id: 1, reason: 'test' }] },
    });

    const result = await reportService.getReports(2);

    expect(apiClient.get).toHaveBeenCalledWith('/reports?page=2', expect.any(Object));
    expect(result).toEqual([{ id: 1, reason: 'test' }]);
  });

  it('deleteReport calls correct endpoint', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });

    await reportService.deleteReport(5);

    expect(apiClient.delete).toHaveBeenCalledWith('/reports/5', expect.any(Object));
  });
});
