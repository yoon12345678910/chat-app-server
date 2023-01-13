import { PaginationOptions } from './../types';

export const parsePaginationQuery = (query?: {
  page?: string;
  limit?: string;
}): PaginationOptions => ({
  page: parseInt(query?.page as string) || 1,
  limit: parseInt(query?.limit as string) || 10,
});
