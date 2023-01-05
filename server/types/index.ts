export interface APIResponse<Data = any> {
  success: boolean;
  message?: string;
  data?: Data;
}
