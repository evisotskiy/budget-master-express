const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');

function generateTokenPair(userId, expiresIn = '15m') {
    return {
        accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn }),
        refreshToken: uuid(),
    };
}

exports.generateTokenPair = generateTokenPair;
