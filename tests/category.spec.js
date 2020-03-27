require('jest-ajv');
const supertest = require("supertest");
const jwt = require('jsonwebtoken');

const User = require('../src/models/User');
const Category = require('../src/models/Category');
const { createApp } = require('../src/app');

// utils, schemas
const { generateTokenPair } = require('../src/utils/token');
const { setupDB } = require('./helpers/setup-test-db');
const { cleanUpCollectionAfterEach } = require('./helpers/jest-helpers');
const { createCategorySchema, getCategorySchema, getCategoryListSchema } = require('./validationSchemas/category.schemas');
const { errorSchema, validationErrorSchema } = require('./validationSchemas/common.schemas');

describe('Category routes test suit', () => {
    setupDB();
    cleanUpCollectionAfterEach('categories');

    let app,
        user,
        routesBaseUri = '/api/category',
        refreshToken,
        accessToken,
        result;

    const email = 'evisotskiydev+5@gmail.com';
    const password = 'qwerty';
    const name = 'Eugene';

    const limit = 100;
    const title = 'Test Category'

    beforeAll(async () => {
        app = supertest(createApp());

        user = new User({ email, password, name });
        await user.save();

        const tokenPair = generateTokenPair(user.id);
        refreshToken = tokenPair.refreshToken;
        accessToken = tokenPair.accessToken;
    });

    beforeEach(() => result = null)

    it(`create new category`, async () => {
        try {
            result = await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send({ title, limit })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(201);
        expect(result.body).toMatchSchema(createCategorySchema);
    })

    it(`get 422 if try to create existing category`, async () => {
        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.post(`${routesBaseUri}/`).set('Authorization', `Bearer ${accessToken}`).send({ title, limit })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(422);
        expect(result.body).toMatchSchema(validationErrorSchema);
    })

    it(`get 422 if try to create category with invalid fields`, async () => {
        const invalidTitle = 'q'; // too short
        const invalidLimit = 'hundred'; // not numeric

        let allResults;
        const payloadCombinations = [
            { title: invalidTitle, limit },
            { title, limit: invalidLimit },
            { title: invalidTitle, limit: invalidLimit },
        ]

        try {
            allResults = await Promise.all(
                payloadCombinations.map(async payload =>
                    await app.post(`${routesBaseUri}/`)
                        .set('Authorization', `Bearer ${accessToken}`)
                        .send(payload))
            )
        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(3);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })

    it(`get existing category`, async () => {
        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.get(`${routesBaseUri}/${category.id}`).set('Authorization', `Bearer ${accessToken}`);
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body).toMatchSchema(getCategorySchema);
        expect(result.body.title).toBe(title);
        expect(result.body.limit).toBe(limit);
    })

    it(`get 404 if try to get nonexistent category`, async () => {
        const nonexistentCategoryId = 9e15;
        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.get(`${routesBaseUri}/${nonexistentCategoryId}`).set('Authorization', `Bearer ${accessToken}`);
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`update existing category`, async () => {
        const newTitle = 'New Category Title';
        const newLimit = 100500;

        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.patch(`${routesBaseUri}/${category.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: newTitle, limit: newLimit })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body).toMatchSchema(getCategorySchema);
        expect(result.body.title).toBe(newTitle);
        expect(result.body.limit).toBe(newLimit);
    })

    it(`get 422 if try to update category with empty required fields`, async () => {
        const emptyTitle = '';
        const emptyLimit = ''

        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.patch(`${routesBaseUri}/${category.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: emptyTitle, limit: emptyLimit })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(422);
    })

    it(`get 404 if try to update nonexistent category`, async () => {
        const newTitle = 'New Category Title';
        const newLimit = 100500;
        const nonexistentCategoryId = 9e15;

        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.patch(`${routesBaseUri}/${nonexistentCategoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: newTitle, limit: newLimit })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(404);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`get all user's categories`, async () => {
        try {
            const category = new Category({ userId: user.id, title, limit });
            await category.save();

            result = await app.get(`${routesBaseUri}/list`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(1);
        expect(result.body).toMatchSchema(getCategoryListSchema);
    })

    it(`get empty array if user doesn't have any category`, async () => {
        try {
            result = await app.get(`${routesBaseUri}/list`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body.length).toEqual(0);
        expect(result.body).toMatchSchema(getCategoryListSchema);
    })
});
