const { Router } = require('express');
const _ = require('lodash');

const User = require('../models/User');
const checkValidationResults = require('../middlewares/validation.middleware');

const { updateInfoValidators } = require('./user.validators');

const router = Router();

router.get('/info', async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, bill, locale } = await User.findOne({ id: userId });

    res.json({ name, bill, locale });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/info', updateInfoValidators, checkValidationResults, async (req, res) => {
  try {
    const { userId } = req.user;
    const dataToUpdate = _.pick(req.body, ['name', 'bill', 'locale']);
    const { name, bill, locale } = await User.findOneAndUpdate({ id: userId }, dataToUpdate, {
      runValidators: true,
      new: true,
    });

    res.json({ name, bill, locale });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
