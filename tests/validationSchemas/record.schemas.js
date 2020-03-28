const { recordTypes } = require('../../src/constants');

const createUpdateRecordSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    amount: { type: 'number' },
    date: { type: 'string' },
    type: {
      type: 'string',
      enum: recordTypes,
    },
    categoryId: { type: 'number' },
    id: { type: 'number' },
  },
  required: ['description', 'amount', 'date', 'type', 'categoryId', 'id'],
  additionalProperties: false,
};

const getRecordSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    amount: { type: 'number' },
    date: { type: 'string' },
    type: {
      type: 'string',
      enum: recordTypes,
    },
    categoryId: { type: 'number' },
  },
  required: ['description', 'amount', 'date', 'type', 'categoryId'],
  additionalProperties: false,
};

const getRecordListSchema = {
  type: 'array',
  items: createUpdateRecordSchema,
  default: [],
};

module.exports = {
  createUpdateRecordSchema,
  getRecordSchema,
  getRecordListSchema,
};
