require('jest-ajv');
const supertest = require("supertest");

const User = require('../src/models/User');
const { createApp } = require('../src/app');

// utils, schemas
const { generateTokenPair } = require('../src/utils/token');
const { setupDB } = require('./helpers/setup-test-db');
const { cleanUpDBAfterEach } = require('./helpers/jest-helpers');
const { authSchema } = require('./validationSchemas/auth.schemas');
const { errorSchema, validationErrorSchema } = require('./validationSchemas/common.schemas');


describe('Auth routes test suit', () => {
    setupDB();
    cleanUpDBAfterEach();

    let app,
        routesBaseUri = '/api/auth',
        routesUserUri = '/api/user',
        result;

    const email = 'evisotskiydev+5@gmail.com';
    const password = 'qwerty';
    const confirm = 'qwerty';
    const name = 'Eugene';

    beforeAll(() => {
        app = supertest(createApp())
    });

    beforeEach(() => result = null)

    it(`register new user`, async () => {
        try {
            result = await app.post(`${routesBaseUri}/register`).send({ email, password, confirm, name })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(201);
        expect(result.body).toMatchSchema(authSchema);
    })

    it(`get 422 when try to register existing user`, async () => {
        try {
            const user = new User({ email, password, name })
            await user.save()

            result = await app.post(`${routesBaseUri}/register`).send({ email, password, confirm, name })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(422);
        expect(result.body).toMatchSchema(validationErrorSchema);
    })

    it(`get 422 when try to register user with wrong email or password`, async () => {
        const wrongEmail = 'wrong@email@gmail.com';
        const wrongPassword = 'pas'; // too short
        const wrongConfirm = 'password';
        const wrongName = 'N'; // too short
        let allResults;
        const payloadCombinations = [
            { email: wrongEmail, password, confirm, name },
            { email, password: wrongPassword, confirm, name },
            { email, password, confirm: wrongConfirm, name },
            { email, password, confirm, name: wrongName },
            { email: wrongEmail, password: wrongPassword, confirm: wrongConfirm, name: wrongName }
        ]

        try {
            allResults = await Promise.all(payloadCombinations.map(async payload => await app.post(`${routesBaseUri}/register`).send(payload)))
        } catch (e) {
            console.error(e)
        }

        expect(allResults.length).toBe(5);

        allResults.forEach(result => {
            expect(result.status).toEqual(422);
            expect(result.body).toMatchSchema(validationErrorSchema);
        })
    })

    it(`login with registered user's credentials`, async () => {
        try {
            const user = new User({ email, password, name });
            await user.save()

            result = await app.post(`${routesBaseUri}/login`).send({ email, password })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(200);
        expect(result.body).toMatchSchema(authSchema);
    })

    it(`get 401 when try to login with wrong user's credentials`, async () => {
        const wrongEmail = 'wrong-email@gmail.com';
        const wrongPassword = 'wrong-password';

        try {
            const user = new User({ email, password, name });
            await user.save()

            result = await app.post(`${routesBaseUri}/login`).send({ email: wrongEmail, password: wrongPassword })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(401);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`logout authenticated user`, async () => {
        try {
            const user = new User({ email, password, name });
            await user.save()

            const { accessToken } = generateTokenPair(user.id);

            result = await app.get(`${routesBaseUri}/logout`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toBe(200)
    });

    it(`get 401 if try to access protected info with expired access token`, async () => {
        try {
            const user = new User({ email, password, name });
            await user.save();

            const { accessToken } = generateTokenPair(user.id, '1s');
            await new Promise((resolve) => setTimeout(resolve, 1000));

            result = await app.get(`${routesUserUri}/info`).set('Authorization', `Bearer ${accessToken}`)
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toEqual(401);
        expect(result.body).toMatchSchema(errorSchema);
    })

    it(`refresh expired access token`, async () => {
        try {
            const user = new User({ email, password, name });
            await user.save();

            const { accessToken, refreshToken } = generateTokenPair(user.id);
            await user.setRefreshToken(refreshToken);

            result = await app.post(`${routesBaseUri}/refresh`).set('Authorization', `Bearer ${accessToken}`).send({ refreshToken })
        } catch (e) {
            console.error(e)
        }

        expect(result.status).toBe(200)
        expect(result.body).toMatchSchema(authSchema);
    });
});
