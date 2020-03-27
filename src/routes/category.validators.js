const { check } = require('express-validator')
const Category = require('../models/Category')

exports.createUpdateValidators = [
    check('title')
        .trim()
        .escape()
        .isLength({ min: 2, max: 56 }).withMessage('Category title must be at least 2 symbols and less than 56 symbols')
        .custom(async (title, { req }) => {
            try {
                const category = await Category.findOne({ userId: req.user.userId, title });
                if (category) {
                    return Promise.reject('This category is already exists')
                }
            } catch (e) {
                console.error(e);
            }
        }),
    check('limit')
        .isNumeric()
]
