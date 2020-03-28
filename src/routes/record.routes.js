const { Router } = require('express');
const _ = require('lodash');

const Category = require('../models/Category');
const Record = require('../models/Record');
const checkValidationResults = require('../middlewares/validation.middleware');
const { createUpdateValidators } = require('./record.validators');

const router = Router();

const allowedFormDataFields = ['description', 'amount', 'date', 'type', 'categoryId'];

router.get('/list', async (req, res) => {
  try {
    const { userId } = req.user;

    let records = await Record.find({ userId });

    records = records.map((record) => _.pick(record, [...allowedFormDataFields, 'id']));

    res.status(200).json(records);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/list/:categoryId', async (req, res) => {
  try {
    const { userId } = req.user;

    const category = await Category.findOne({ id: req.params.categoryId });

    if (!category) {
      return res.status(404).json({
        message: `Category with id = ${req.params.categoryId} is not found`,
      });
    }

    let records = await Record.find({
      userId,
      categoryId: req.params.categoryId,
    });

    records = records.map((record) => _.pick(record, [...allowedFormDataFields, 'id']));

    res.status(200).json(records);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.user;

    const record = await Record.findOne({ id: req.params.id, userId });

    if (!record) {
      return res.status(404).json({ message: `Record with id = ${req.params.id} is not found` });
    }

    const { description, amount, date, type, categoryId } = record;

    res.status(200).json({ description, amount, date, type, categoryId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', createUpdateValidators, checkValidationResults, async (req, res) => {
  try {
    const { userId } = req.user;
    const formData = _.pick(req.body, allowedFormDataFields);

    const record = new Record({ ...formData, userId });
    await record.save();

    const { description, amount, date, type, categoryId, id } = record;

    res.status(201).json({ description, amount, date, type, categoryId, id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/:id', createUpdateValidators, checkValidationResults, async (req, res) => {
  try {
    const { userId } = req.user;
    const formData = _.pick(req.body, allowedFormDataFields);

    const record = await Record.findOneAndUpdate({ id: req.params.id, userId }, formData, {
      runValidators: true,
      new: true,
    });

    if (!record) {
      return res.status(404).json({ message: `Record with id = ${req.params.id} is not found` });
    }

    const { description, amount, date, type, categoryId } = record;

    res.status(200).json({ description, amount, date, type, categoryId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.user;

    const record = await Record.findOneAndRemove({ id: req.params.id, userId });

    if (!record) {
      return res.status(404).json({ message: `Record with id = ${req.params.id} is not found` });
    }

    const { description, amount, date, type, categoryId, id } = record;

    res.json({ description, amount, date, type, categoryId, id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
