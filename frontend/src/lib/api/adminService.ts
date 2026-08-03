import authUtils from "../authUtils";
import apiClient from "./apiClient";
import { Modification, Patchnote } from "@/types/patchNoteType";
import { BanUserData } from "@/types/authType";

type ReportData = {
  reason: string;
  reportableId: number;
  reportableEntity: string;
  id?: number;
  reportedAt?: string;
  // Add other report fields as needed
};

/** Taille de page unique côté dashboard (alignée sur l'API pour chaque collection) */
export const ADMIN_PAGE_SIZE = 10;

function buildQuery(
  params: Record<string, string | number | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

class AdminService {
  /**
   * Gets reports, newest first, with optional search and entity type filter
   */
  async getReports(
    page = 1,
    q = "",
    reportableEntity = ""
  ): Promise<{ member: ReportData[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const url = `/reports${buildQuery({ page, q, reportableEntity })}`;

    const response = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Gets modifications, newest first, with optional search
   */
  async getModifications(
    page = 1,
    q = ""
  ): Promise<{ member: Modification[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const url = `/admin/modifications${buildQuery({ page, q })}`;

    const response = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Gets patchnotes, newest first, with optional search and importance filter
   */
  async getPatchnotes(
    page = 1,
    q = "",
    importance = ""
  ): Promise<{ member: Patchnote[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    // itemsPerPage : la collection publique sert 6 par page, le dashboard en veut 10
    const url = `/patchnotes${buildQuery({
      page,
      q,
      importance,
      itemsPerPage: ADMIN_PAGE_SIZE,
    })}`;

    const response = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Deletes a report by ID
   */
  async deleteReport(id: number): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.delete(`/reports/${id}`, config);
  }

  /**
   * Deletes a patchnote by ID
   */
  async deletePatchnote(id: number): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.delete(`/patchnotes/${id}`, config);
  }

  /**
   * Deletes a modification by ID
   */
  async deleteModification(id: number): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.delete(`/modifications/${id}`, config);
  }

  /**
   * Gets reports for a specific reportable entity and ID
   */
  async getReportsForEntity(
    entityType: string,
    entityId: number
  ): Promise<{ member: ReportData[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const response = await apiClient.get(
      `/reports${buildQuery({
        reportableEntity: entityType,
        reportableId: entityId,
      })}`,
      config
    );
    return response.data;
  }
  /**
   * Bans a user with a reason and optional duration
   */
  async banUser(userId: number, banData: BanUserData): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.post(`/users/${userId}/ban`, banData, config);
  }
  /**
   * Unbans a user by calling the unban endpoint
   */
  async unbanUser(userId: number): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.post(`/users/${userId}/unban`, {}, config);
  }
}

const adminService = new AdminService();
export default adminService;
