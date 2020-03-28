const { check } = require('express-validator');
// // const User = require('../models/User');
const { availableLocales } = require('../constants');

exports.updateInfoValidators = [
  check('name').trim().isLength({ min: 3 }).withMessage('Name should be longer than 3 symbols'),
  check('bill').isNumeric(),
  check('locale').isIn(availableLocales),
];
