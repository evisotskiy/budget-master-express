const { Router } = require('express');

const { generateTokenPair } = require('../utils/token');
const { checkValidation } = require('../middlewares/validation.middleware.js');
const User = require('../models/User');
const authCheck = require('../middlewares/auth.middleware');
const checkValidationResults = require('../middlewares/validation.middleware');
const { registerValidators, loginValidators } = require('./auth.validators')

const router = Router()

router.post('/register', registerValidators, checkValidationResults, async (req, res) => {
    try {
        const { email, password, name } = req.body

        const user = new User({ email, password, name })
        await user.save();

        const { accessToken, refreshToken } = generateTokenPair(user.id);

        user.refreshToken = refreshToken;

        await user.save();

        res.status(201).json({ accessToken, refreshToken })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.post('/login', loginValidators, checkValidationResults, async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })

        if (!user || !user.comparePassword(password)) {
            return res.status(401).json({ message: 'Bad credentials' })
        }

        const { accessToken, refreshToken } = generateTokenPair(user.id)

        user.refreshToken = refreshToken;

        await user.save()

        res.json({ accessToken, refreshToken })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/logout', authCheck(), async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User.findOne({ id: userId })

        user.refreshToken = null;
        await user.save();

        res.sendStatus(200)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.post('/refresh', authCheck({ isVerificationNeeded: false }), async (req, res) => {
    try {
        const { refreshToken: expiredRefreshToken } = req.body;
        const { userId } = req.user;

        const user = await User.findOne({ id: userId })

        if (user.refreshToken !== expiredRefreshToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { accessToken, refreshToken } = generateTokenPair(userId)

        await user.setRefreshToken(refreshToken);

        res.json({ accessToken, refreshToken })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

module.exports = router
