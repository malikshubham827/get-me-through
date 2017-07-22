let mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/GetMeThrough',{ useMongoClient: true });

module.exports = {mongoose};