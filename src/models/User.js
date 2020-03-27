const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);
const bcrypt = require('bcryptjs');

const { availableLocales } = require('../constants');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: String,
    name: {
        type: String,
        required: true
    },
    bill: {
        type: Number,
        default: 10000,
        required: true
    },
    locale: {
        type: String,
        default: 'ru-RU',
        required: true,
        enum: availableLocales
    }
})

UserSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(this.password, salt);
    this.password = hashedPassword;

    next();
})

UserSchema.methods.comparePassword = function (plaintext) {
    return bcrypt.compareSync(plaintext, this.password);
}

UserSchema.methods.setRefreshToken = function (newRefreshToken) {
    this.refreshToken = newRefreshToken;
    return this.save()
}

UserSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'UserSchema' });

module.exports = mongoose.model('User', UserSchema)