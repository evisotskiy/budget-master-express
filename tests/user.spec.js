require('jest-ajv');
const supertest = require("supertest");

const User = require('../src/models/User');
const { createApp } = require('../src/app');

// utils, schemas
const { generateTokenPair } = require('../src/utils/token');
const { setupDB } = require('./helpers/setup-test-db');
const { cleanUpDBAfterEach } = require('./helpers/jest-helpers');
const { userInfoSchema } = require('./validationSchemas/user.schemas');
const { validationErrorSchema } = require('./validationSchemas/common.schemas');

describe('User routes test suit', () => {
    setupDB();
    cleanUpDBAfterEach();

    let app,
        user,
        routesBaseUri = '/api/user',
        refreshToken,
        accessToken,
        result;

    const email = 'evisotskiydev+5@gmail.com';
    const password = 'qwerty';
    const confirm = 'qwerty';
    const name = 'Eugene';

    beforeAll(() => {
        app = supertest(createApp());
    });

    beforeEach(async () => {
        try {
            const user = new User({ email, password, name });
            await user.save();

            const tokenPair = generateTokenPair(user.id);
            refreshToken = tokenPair.refreshToken;
            accessToken = tokenPair.accessToken;

            result = null;
        } catch (e) {
            console.error(e)
        }
    })

    it('get user info', async () => {
        try {
            result = await app.get(`${routesBaseUri}/info`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toBe(200)
        expect(result.body).toMatchSchema(userInfoSchema);
    })

    it('update user info', async () => {
        const name = 'New Name';
        const bill = 150150;
        const locale = 'en-US';

        try {
            result = await app.patch(`${routesBaseUri}/info`).set('Authorization', `Bearer ${accessToken}`).send({ name, bill, locale })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toBe(200)
        expect(result.body).toMatchSchema(userInfoSchema);
        expect(result.body.name).toBe(name);
        expect(result.body.bill).toBe(bill);
        expect(result.body.locale).toBe(locale);
    })

    it('get 422 if updated user info is invalid', async () => {
        const name = 'New Name';
        const bill = 150150;
        const locale = 'en-US';
        const invalidName = 'Ne';
        const invalidBill = null;
        const invalidLocale = 'uk-UA';
        let allResults;
        const payloadCombinations = [
            { name: invalidName, bill, locale },
            { name, bill: invalidBill, locale },
            { name, bill, locale: invalidLocale },
            { name: invalidName, bill: invalidBill, locale: invalidLocale }
        ]

        try {
            allResults = await Promise.all(payloadCombinations.map(async payload =>
                await app.patch(`${routesBaseUri}/info`).set('Authorization', `Bearer ${accessToken}`).send(payload)));

        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(4);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })
});