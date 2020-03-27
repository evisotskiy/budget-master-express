require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const authCheck = require('./middlewares/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const recordRoutes = require('./routes/record.routes');

const upload = multer();

const createApp = () => {
    const app = express()

    app.use(express.json({ extended: true }))
    app.use(upload.none())

    app.use('/api/auth', authRoutes)

    app.use(authCheck())

    app.use('/api/user', userRoutes)
    app.use('/api/category', categoryRoutes)
    app.use('/api/record', recordRoutes)

    return app;
}

if (!module.parent) {
    (async () => {
        try {
            const PORT = process.env.PORT || 5000;

            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useFindAndModify: false,
                useCreateIndex: true,
                useUnifiedTopology: true,
            })

            createApp().listen(PORT, () => console.log('App has been started on port %s', PORT));
        } catch (e) {
            console.error(e)
        }
    })()
}

exports.createApp = createApp;
