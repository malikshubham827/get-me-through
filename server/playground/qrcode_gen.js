let qr = require('qr-image');
let {
    visitorOneId,
    visitorTwoId
} = require('./../tests/seed/seed');
qr
.image('Barack Obama.' + visitorOneId,{type:'png'})
.pipe(require('fs')
.createWriteStream('first_qr.png'));

qr
.image('Joe Biden.' + visitorTwoId,{type:'png'})
.pipe(require('fs')
.createWriteStream('second_qr.png'));