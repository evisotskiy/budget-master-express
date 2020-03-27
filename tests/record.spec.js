require('jest-ajv');
const supertest = require("supertest");
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Record = require('../src/models/Record');
const { createApp } = require('../src/app');

// utils, schemas
const { generateTokenPair } = require('../src/utils/token');
const { recordTypes } = require('../src/constants');
const { setupDB } = require('./helpers/setup-test-db');
const { cleanUpCollectionAfterEach } = require('./helpers/jest-helpers');
const { createUpdateRecordSchema, getRecordSchema, getRecordListSchema } = require('./validationSchemas/record.schemas');
const { errorSchema, validationErrorSchema } = require('./validationSchemas/common.schemas');

describe('Category routes test suit', () => {
    setupDB();
    cleanUpCollectionAfterEach('records', 'categories');

    let app,
        user,
        category,
        routesBaseUri = '/api/record',
        refreshToken,
        accessToken,
        result;

    const email = 'evisotskiydev+5@gmail.com';
    const password = 'qwerty';
    const name = 'Eugene';
    const limit = 100;
    const title = 'Test Category';

    const description = 'Test Record';
    const amount = 150;
    const date = new Date().toISOString()
    const type = recordTypes[0]

    beforeAll(async () => {
        app = supertest(createApp());

        user = new User({ email, password, name });
        await user.save();

        category = new Category({ userId: user.id, title, limit });
        await category.save();

        const tokenPair = generateTokenPair(user.id);
        refreshToken = tokenPair.refreshToken;
        accessToken = tokenPair.accessToken;
    });

    beforeEach(() => result = null)

    async function generateCategoriesAndRecords(categoriesAmount, recordsAmount) {
        let allCategories = [];

        try {
            // create ${categoriesAmount} different categories
            for (let newCategory = null, i = 0; i < 3; i++) {
                newCategory = new Category({ userId: user.id, title: `New title ${i + 1}`, limit: 200400 });
                await newCategory.save();

                // create ${recordsAmount} records for each category
                for (let newRecord = null, j = 0; j < 5; j++) {
                    newRecord = new Record({
                        description: `${description} ${j}`,
                        amount,
                        date,
                        type: recordTypes[Math.floor(Math.random() * 2)], // random type - 0 or 1
                        categoryId: newCategory.id,
                        userId: user.id
                    });

                    await newRecord.save();
                    newRecord = null;
                }

                allCategories.push(newCategory);
                newCategory = null;
            }
        } catch (e) {
            console.log(e);
        }

        return allCategories;
    }

    it(`create new record`, async () => {
        try {
            result = await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send({ description, amount, date, type, categoryId: category.id })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(201);
        expect(result.body).toMatchSchema(createUpdateRecordSchema);
    })

    it(`get 422 if try to create record with invalid fields`, async () => {
        const invalidDescription = 'description'.repeat(6); // too long
        const invalidAmount = 'hundred'; // not numeric
        const invalidDate = '11.02.1990'; // not ISO8601
        const invalidType = 'some wrong type'; // not in enum
        const invalidCategoryId = 'firstId'; // not numeric

        let allResults;
        const payloadCombinations = [
            { description: invalidDescription, amount, date, type, categoryId: category.id },
            { description, amount: invalidAmount, date, type, categoryId: category.id },
            { description, amount, date: invalidDate, type, categoryId: category.id },
            { description, amount, date, type: invalidType, categoryId: category.id },
            { description, amount, date, type, categoryId: invalidCategoryId },
            { description: invalidDescription, amount: invalidAmount, date: invalidDate, type: invalidType, categoryId: invalidCategoryId }
        ];

        try {
            allResults = await Promise.all(payloadCombinations.map(async payload => await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send(payload)))
        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(6);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })

    it(`get 422 if try to create record without required fields`, async () => {
        let allResults;
        const payloadCombinations = [
            { description, date, type, categoryId: category.id }, // without amount
            { description, amount, type, categoryId: category.id }, // without date
            { description, amount, date, categoryId: category.id }, // without type
            { description, amount, date, type }, // without categoryId
            { description }, // without all required fields
        ];

        try {
            allResults = await Promise.all(payloadCombinations.map(async payload => await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send(payload)))
        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(5);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })
    it(`get existing record by id`, async () => {
        try {
            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            result = await app.get(`${routesBaseUri}/${record.id}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body).toMatchSchema(getRecordSchema);
    })

    it(`get 404 if try to get nonexistent record by id`, async () => {
        try {
            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            const nonexistentRecordId = 9e15;

            result = await app.get(`${routesBaseUri}/${nonexistentRecordId}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`update existing record`, async () => {
        const newDescription = 'New description';
        const newAmount = 100500;
        const newDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(); // yesterday
        const newType = recordTypes[1];
        let newCategory;

        try {
            newCategory = new Category({ userId: user.id, title: 'New title', limit: 200400 });
            await newCategory.save();

            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            result = await app.patch(`${routesBaseUri}/${record.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    description: newDescription,
                    amount: newAmount,
                    date: newDate,
                    type: newType,
                    categoryId: newCategory.id,
                })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body).toMatchSchema(getRecordSchema);
    })

    it(`get 422 if try to update record with invalid fields`, async () => {
        const invalidDescription = 'description'.repeat(6); // too long
        const invalidAmount = 'hundred'; // not numeric
        const invalidDate = '11.02.1990'; // not ISO8601
        const invalidType = 'some wrong type'; // not in enum
        const invalidCategoryId = 'firstId'; // not numeric

        let allResults;
        const payloadCombinations = [
            { description: invalidDescription, amount, date, type, categoryId: category.id },
            { description, amount: invalidAmount, date, type, categoryId: category.id },
            { description, amount, date: invalidDate, type, categoryId: category.id },
            { description, amount, date, type: invalidType, categoryId: category.id },
            { description, amount, date, type, categoryId: invalidCategoryId },
            { description: invalidDescription, amount: invalidAmount, date: invalidDate, type: invalidType, categoryId: invalidCategoryId }
        ];

        try {
            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            allResults = await Promise.all(payloadCombinations.map(async payload => await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send(payload)))
        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(6);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })

    it(`get 404 if try to update nonexistent record`, async () => {
        const newDescription = 'New description';
        const newAmount = 100500;
        const newDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(); // yesterday
        const newType = recordTypes[1];
        let newCategory;
        const nonexistentRecordId = 9e15;

        try {
            newCategory = new Category({ userId: user.id, title: 'New title', limit: 200400 });
            await newCategory.save();

            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            result = await app.patch(`${routesBaseUri}/${nonexistentRecordId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    description: newDescription,
                    amount: newAmount,
                    date: newDate,
                    type: newType,
                    categoryId: newCategory.id,
                })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`delete existing record`, async () => {
        let record;
        let deletedRecord;

        try {
            record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            result = await app.delete(`${routesBaseUri}/${record.id}`).set('Authorization', `Bearer ${accessToken}`)

            deletedRecord = await Record.findOne({ id: record.id, userId: user.id });
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.id).toEqual(record.id);
        expect(deletedRecord).toBeNull();
    })

    it(`get 404 if try to delete nonexistent record`, async () => {
        const nonexistentRecordId = 9e15;

        try {
            const record = new Record({ description, amount, date, type, categoryId: category.id, userId: user.id });
            await record.save();

            result = await app.delete(`${routesBaseUri}/${nonexistentRecordId}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`get all user's records`, async () => {
        try {
            // generate 3 categories with 5 records in each
            await generateCategoriesAndRecords(3, 5);

            result = await app.get(`${routesBaseUri}/list`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(15); // 3 categories with 5 records in each
        expect(result.body).toMatchSchema(getRecordListSchema);
    })

    it(`get empty array if user doesn't have any record`, async () => {
        try {
            result = await app.get(`${routesBaseUri}/list`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(0);
        expect(result.body).toMatchSchema(getRecordListSchema);
    })

    it(`get all user's records by the certain category`, async () => {
        try {
            // generate 3 categories with 5 records in each
            const allCategories = await generateCategoriesAndRecords(3, 5);

            result = await app.get(`${routesBaseUri}/list/${allCategories[0].id}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(5); // 5 records in the first category
        expect(result.body).toMatchSchema(getRecordListSchema);

    })

    it(`get empty array if user doesn't have any record with the certain category`, async () => {
        try {
            // generate 3 categories with 5 records in each
            await generateCategoriesAndRecords(3, 5);
            // and create 1 new category without records
            newCategory = new Category({ userId: user.id, title: `Another new title`, limit: 200400 });
            await newCategory.save();

            // try to fetch all records from the last category
            result = await app.get(`${routesBaseUri}/list/${newCategory.id}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(0);
        expect(result.body).toMatchSchema(getRecordListSchema);
    })

    it(`get 404 if try to get records with the nonexistent category`, async () => {
        const nonexistentCategoryId = 9e15;

        try {
            // generate 3 categories with 5 records in each
            await generateCategoriesAndRecords(3, 5);

            // try to fetch all records from nonexistent category
            result = await app.get(`${routesBaseUri}/list/${nonexistentCategoryId}`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })
});