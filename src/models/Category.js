const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CategorySchema = new mongoose.Schema({
    limit: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Number,
        ref: 'User',
        required: true
    }
})

CategorySchema.plugin(AutoIncrement, { inc_field: 'id', id: 'CategorySchema' });

module.exports = mongoose.model('Category', CategorySchema)