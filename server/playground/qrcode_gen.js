let qr = require('qr-image');

qr.image('Hello World to you QR.234klhjk1h435kj',{type:'png'})
.pipe(require('fs').createWriteStream('first_qr.png'));