/* this code is taken from the article https://zellwk.com/blog/jest-and-mongoose/ */
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.promise = global.Promise;

function setupDB() {
  // Connect to Mongoose
  beforeAll(async () => {
    await mongoose.connect(
      global.__MONGO_URI__,
      {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true,
      },
      (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
      },
    );
  });

  // Disconnect Mongoose
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
}

module.exports = {
  setupDB,
};
