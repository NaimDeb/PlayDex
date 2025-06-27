import authUtils from "../authUtils";
import apiClient from "./apiClient";
import { Modification, Patchnote } from "@/types/patchNoteType";
import { BanUserData } from "@/types/authType";

type ReportData = {
  reason: string;
  reportableId: number;
  reportableEntity: string;
  id?: number;
  createdAt?: string;
  // Add other report fields as needed
};

class AdminService {
  /**
   * Gets all reports with optional pagination
   */
  async getReports(
    page?: number
  ): Promise<{ member: ReportData[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const url = page ? `/reports?page=${page}` : "/reports";

    const response = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Gets all modifications with optional pagination
   */
  async getModifications(
    page?: number
  ): Promise<{ member: Modification[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const url = page
      ? `/admin/modifications?page=${page}`
      : "/admin/modifications";

    const response = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Gets all patchnotes with optional pagination
   */
  async getPatchnotes(
    page?: number
  ): Promise<{ member: Patchnote[]; totalItems: number }> {
    const config = authUtils.getAuthorization();
    const url = page ? `/patchnotes?page=${page}` : "/patchnotes";

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
      `/reports?reportableEntity=${entityType}&reportableId=${entityId}`,
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
