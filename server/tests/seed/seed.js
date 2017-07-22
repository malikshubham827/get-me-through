const {ObjectID} = require('mongodb');
const path = require('path');
const {mongoose} = require(path.join(__dirname, './../../db/db'));
const {Visitor} = require(path.join(__dirname ,'/../../models/visitor'));

let visitorOneId = new ObjectID();
let visitorTwoId = new ObjectID();

let visitors = [{
    _id: visitorOneId,
    name: 'Barack Obama',
    email: 'hello1@example.com'
}, {
    _id: visitorTwoId,
    name: 'Joe Biden',
    email: 'hello2@example.com'
}];

// Useful while testit like when running server.test.js
let populateVisitors = () => {
    Visitor.remove({})
    .then(() => {
        let visitorOne = new Visitor(visitors[0]).save();
        let visitorTwo = new Visitor(visitors[1]).save();

        return Promise.all([visitorOne, visitorTwo]);
    })
    .then(() => mongoose.disconnect());
};

populateVisitors();

module.exports = {
    visitorOneId,
    visitorTwoId
};