const { Router } = require('express');
const _ = require('lodash');

const Category = require('../models/Category');
const checkValidationResults = require('../middlewares/validation.middleware');
const { createUpdateValidators } = require('./category.validators');

const router = Router();

const allowedFormDataFields = ['title', 'limit'];

// should be before get /:id, because app think that /list is id
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.user;
    let categories = await Category.find({ userId });

    categories = categories.map((category) => _.pick(category, [...allowedFormDataFields, 'id']));

    res.json(categories);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.user;
    const category = await Category.findOne({ id: req.params.id, userId });

    if (!category) {
      return res.status(404).json({ message: `Category with id = ${req.params.id} is not found` });
    }

    res.json({ title: category.title, limit: category.limit });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', createUpdateValidators, checkValidationResults, async (req, res) => {
  try {
    const { userId } = req.user;
    const formData = _.pick(req.body, allowedFormDataFields);

    const category = new Category({ ...formData, userId });
    await category.save();

    const { title, limit, id } = category;

    res.status(201).json({ title, limit, id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/:id', createUpdateValidators, checkValidationResults, async (req, res) => {
  try {
    const { userId } = req.user;
    const formData = _.pick(req.body, allowedFormDataFields);
    const category = await Category.findOneAndUpdate({ id: req.params.id, userId }, formData, {
      runValidators: true,
      new: true,
    });

    if (!category) {
      return res.status(404).json({
        message: `Category with id = ${req.params.id} is not found`,
      });
    }

    const { title, limit } = category;

    res.json({ title, limit });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
