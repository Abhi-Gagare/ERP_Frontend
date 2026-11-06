import { request, type FeeStats } from "@/lib/api";

export const accountantApi = {
  overview: () => request<FeeStats>("/finance/overview"),
};
