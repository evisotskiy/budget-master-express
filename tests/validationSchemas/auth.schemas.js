const authSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['accessToken', 'refreshToken'],
  additionalProperties: false,
};

module.exports = {
  authSchema,
};
