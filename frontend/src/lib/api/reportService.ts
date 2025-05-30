import authUtils from "../authUtils";
import apiClient from "./apiClient";

type ReportData = {
  reason: string;
  reportableId: number;
  reportableEntity: string;
};

class ReportService {
  async postReport(reportData: ReportData): Promise<void> {
    const config = authUtils.getAuthorization();

    const { reason, reportableId, reportableEntity } = reportData;
    const response = await apiClient.post(
      `/reports`,
      { reason, reportableId, reportableEntity },
      config
    );
    return response.data;
  }

  async getReports(page: number): Promise<Array<ReportData>> {
    const config = authUtils.getAuthorization();

    const response = await apiClient.get(`/reports?page=${page}`, config);
    return response.data.member;
  }

  async deleteReport(id: number): Promise<void> {
    const config = authUtils.getAuthorization();
    await apiClient.delete(`/reports/${id}`, config);
  }
}

const reportService = new ReportService();
export default reportService;
