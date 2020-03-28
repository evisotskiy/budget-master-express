const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

function generateTokenPair(userId, expiresIn = '15m') {
  return {
    accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn }),
    refreshToken: uuidv4(),
  };
}

exports.generateTokenPair = generateTokenPair;
