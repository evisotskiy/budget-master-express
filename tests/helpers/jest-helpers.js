/* this code is taken from the article https://zellwk.com/blog/jest-and-mongoose/ */
const mongoose = require('mongoose');

async function removeAllCollections() {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany();
  }
}

// Cleans up database between each test
function cleanUpDBAfterEach() {
  afterEach(async () => {
    await removeAllCollections();
  });
}

function cleanUpCollectionAfterEach() {
  afterEach(async () => {
    for (let i = 0; i < arguments.length; i++) {
      const collectionName = arguments[i];
      await mongoose.connection.collections[collectionName].deleteMany();
    }
  });
}

module.exports = {
  cleanUpDBAfterEach,
  cleanUpCollectionAfterEach,
};
