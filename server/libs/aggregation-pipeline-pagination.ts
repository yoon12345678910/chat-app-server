import { PaginationOptions, PaginationResponse } from './../types';

export type PaginationPipelineResponse<T> = {
  items: T[];
  pagination: PaginationResponse;
};

export const paginationPipeline = (paginationOptions: PaginationOptions) => {
  const { page = 1, limit = 10 } = paginationOptions;
  const skip = (page - 1) * limit;

  return [
    {
      $facet: {
        total: [{ $count: 'count' }],
        data: [],
      },
    },
    {
      $unwind: { path: '$total', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        items: {
          $slice: [
            '$data',
            page > 0 ? skip : '$total.count',
            {
              $ifNull: [limit, '$total.count'],
            },
          ],
        },
        pagination: {
          page: {
            $literal: skip / limit + 1,
          },
          hasNextPage: {
            $lt: [{ $multiply: [limit, page] }, '$total.count'],
          },
          totalPages: {
            $ifNull: [{ $ceil: { $divide: ['$total.count', limit] } }, 1],
          },
          totalItems: {
            $ifNull: ['$total.count', 0],
          },
        },
      },
    },
  ];
};
