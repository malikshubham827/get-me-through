const path = require('path');
const { Visitor } = require(path.join(__dirname, './../models/visitor'));
const { ObjectID } = require('mongodb');

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
}

function verify(name, entryIn) {
    return new Promise((resolve, reject) => {
        Visitor.findOne({ name: name })
            .then((visitor) => {
                if (!visitor) {
                    return reject({
                        name,
                        eventName: 'auth error',
                        msg: 'No such person in Database.',
                    });
                }
                var details = {
                    name,
                    email: visitor.email,
                    status: visitor.status,
                    allow: visitor.allow,
                    timeIn: visitor.timeIn,
                    timeOut: visitor.timeOut
                }
                if (entryIn) {
                    // checking the arriving visitors
                    if (visitor.status === 'out') {
                        if (visitor.allow === 'yes') {
                            // Has permission
                            console.log('has permission');
                            Visitor.findOneAndUpdate({ name }, {
                                $set: {
                                    status: 'in',
                                    timeIn: getFormattedDate()
                                }
                            }, {
                                new: true
                            })
                                .then((visitor) => {
                                    // Update old details
                                    details.status = visitor.status;
                                    details.timeIn = visitor.timeIn;
                                    return resolve({
                                        name,
                                        eventName: 'auth success',
                                        msg: 'Visit logged successfully!',
                                        details
                                    });
                                }).catch((e) => {
                                    console.log('err');
                                    console.log(e);
                                    return reject({
                                        name,
                                        eventName: 'auth error',
                                        msg: 'Some error occurred, please try again.'
                                    })
                                });
                        } else {
                            // Permission denied
                            return reject({
                                name,
                                eventName: 'auth error',
                                msg: 'Person not allowed to enter.'
                            })
                        }
                    } else {
                        // currently inside
                        return resolve({
                            name,
                            eventName: 'auth success',
                            msg: 'Person already logged/inside',
                            details
                        });
                    }
                } else {
                    // check the leaving people
                    if (visitor.status === 'in') {
                        Visitor.findOneAndUpdate({ name }, {
                            $set: {
                                status: 'out',
                                timeOut: getFormattedDate()
                            }
                        }, {
                            new: true
                        })
                            .then((visitor) => {
                                // Update old details
                                details.status = visitor.status;
                                details.timeOut = visitor.timeOut;
                                return resolve({
                                    name,
                                    eventName: 'auth success',
                                    msg: 'Departure logged successfully!',
                                    details
                                });
                            }).catch((e) => {
                                console.log(e);
                                return reject({
                                    name,
                                    eventName: 'auth error',
                                    msg: 'Some error occured, try again.'
                                })
                            })
                    } else {
                        // already left at time
                        return resolve({
                            name,
                            eventName: 'auth success',
                            msg: 'Person already departed',
                            details
                        })
                    }
                }

            })
            .catch((e) => {
                console.log('final');
                console.log(e);
                return reject({
                    name,
                    eventName: 'auth error',
                    msg: 'Some error occurred.'
                });
            });
    });
}

function verifyQR(code, entryIn) {
    let arr1 = code.split('.');
    let name = arr1[0], id = arr1[1];
    if (!ObjectID.isValid(id)) {
        return Promise.reject({
            name,
            eventName: 'qr auth error',
            msg: 'ID not valid'
        });
    }
    // console.log(name,id);
    return Visitor.findOne({ name, _id: id })
        .then((visitor) => {
            console.log(visitor);
            if (!visitor) {
                return Promise.reject({
                    name,
                    eventName: 'qr auth error',
                    msg: 'No such person in the Database.'
                });
            }
            return verify(name, entryIn)
                .then((obj) => {
                    console.log('success..');
                    console.log(obj);
                    return Promise.resolve({
                        name,
                        eventName: 'qr auth success',
                        msg: obj.msg,
                        details: obj.details
                    });
                })
                .catch((obj) => {
                    console.log('catch');
                    console.log(obj);
                    return Promise.reject({
                        name,
                        eventName: 'qr auth error',
                        msg: obj.msg
                    });
                });
        })
        .catch((e) => {
            console.log(e);
            return Promise.reject({
                name,
                eventName: 'qr auth error',
                msg: 'Some error occured, try again'
            })
        });
}

module.exports = {
    verify,
    verifyQR
};