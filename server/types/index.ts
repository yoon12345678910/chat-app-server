export type DateType = string | Date;

export type APIResponse<Data = any> = {
  success: boolean;
  message?: string;
  data?: Data;
  error?: any;
  errors?: any;
};

export type PaginationResponse = {
  page: number;
  hasNextPage: boolean;
  totalPages: number;
  totalItems: number;
};

export type PaginationOptions = {
  page: number;
  limit: number;
};
