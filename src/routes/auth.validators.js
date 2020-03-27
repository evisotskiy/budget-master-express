const { check } = require('express-validator')
const User = require('../models/User')

exports.registerValidators = [
    check('email')
        .isEmail().withMessage('Enter correct email')
        .custom(async (email) => {
            try {
                const user = await User.findOne({ email })
                if (user) {
                    return Promise.reject('This email is already used')
                }
            } catch (e) {
                console.error(e);
            }
        }),
    check('password', 'Password must be at least 6 symbols and contain only numbers and letters')
        .trim()
        .isLength({ min: 6, max: 56 }),
    check('confirm')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords should be equal')
            }
            return true;
        }),
    check('name')
        .isLength({ min: 2 }).withMessage('Name should be longer than 2 symbols')
];

exports.loginValidators = [
    check('email')
        .isEmail().withMessage('Enter correct email')
];
