const jwt = require('jsonwebtoken');

module.exports = ({ isVerificationNeeded = true } = {}) => (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const [, token] = req.headers.authorization.split(' '); // Bearer {token}

    if (isVerificationNeeded) {
      jwt.verify(token, process.env.JWT_SECRET);
    }

    req.user = jwt.decode(token);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
