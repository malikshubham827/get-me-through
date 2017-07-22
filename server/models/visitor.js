const path = require('path');
const { mongoose } = require(path.join(__dirname, '/../db/db'));
const validator = require('validator');

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
}

let visitorSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 1,
        trim: true,
        required: true,
        unique: true,
    },
    status: {
        // current status of person, in or out of the event
        type: String,
        enum: ['in', 'out'],
        default: 'out'
    },
    email: {
        type: String,
        minlength: 1,
        trim: true,
        required: true,
        unique: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value);
            },
            message: '{VALUE} is not a valid Email'
        }
    },
    timeIn: {
        type:String,
        default: getFormattedDate()
    },
    timeOut: {
        type:String,
        default: getFormattedDate()
    },
    allow: {
        // whether allowed to enter like based on whether info is complete etc.
        type: String,
        enum: ['yes', 'no'],
        default: 'yes'
    }
    // Your custom fields:
});

let Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = { Visitor };