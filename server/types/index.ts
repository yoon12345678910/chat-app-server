export type APIResponse<Data = any> = {
  success: boolean;
  message?: string;
  data?: Data;
  error?: any;
  errors?: any;
};

export type PaginationOptions = {
  page: number;
  limit: number;
};

export type DateType = string | Date;
