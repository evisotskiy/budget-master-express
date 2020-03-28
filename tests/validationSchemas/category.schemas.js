const createCategorySchema = {
  type: 'object',
  properties: {
    limit: { type: 'number' },
    title: { type: 'string' },
    id: { type: 'number' },
  },
  required: ['limit', 'title', 'id'],
  additionalProperties: false,
};

const getCategorySchema = {
  type: 'object',
  properties: {
    limit: { type: 'number' },
    title: { type: 'string' },
  },
  required: ['limit', 'title'],
  additionalProperties: false,
};

const getCategoryListSchema = {
  type: 'array',
  items: createCategorySchema,
  default: [],
};

module.exports = {
  createCategorySchema,
  getCategorySchema,
  getCategoryListSchema,
};
