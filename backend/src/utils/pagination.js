import { DEFAULT_PAGE_SIZE } from '../config/constants.js';

export const buildPagination = (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || DEFAULT_PAGE_SIZE), 1), 100);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
};

export const buildMeta = ({ page, pageSize, total }) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

