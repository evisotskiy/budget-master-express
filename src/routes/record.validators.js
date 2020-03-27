const { check } = require('express-validator');
const { recordTypes } = require('../constants');

exports.createUpdateValidators = [
    check('description')
        .trim()
        .escape()
        .isLength({ max: 56 }).withMessage('Record title must be less than 56 symbols'),
    check('amount')
        .isNumeric(),
    check('date')
        .isISO8601(),
    check('type')
        .isIn(recordTypes),
    check('categoryId')
        .isNumeric(),
]
