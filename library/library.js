require('dotenv').config()
const crypto = require("crypto");
const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from(process.env.PASSWORD, 'base64');
const IV_LENGTH = 16;

function dateNow() {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date();
    let month = months[d.getMonth()];
    let date = d.getDate();
    let year = d.getFullYear()
    return `${month} ${date} ${year}`;
}

function cryptoEncrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');

    // let mykey = crypto.createCipher('aes-128-cbc', process.env.PASSWORD);
    // let mystr = mykey.update(str, 'utf8', 'hex')
    // mystr += mykey.final('hex');
    // return mystr
}

function cryptoDecrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();

    // var mykey = crypto.createDecipher('aes-128-cbc', process.env.PASSWORD);
    // var mystr = mykey.update(str, 'hex', 'utf8')
    // mystr += mykey.final('utf8');
    // return mystr
}


module.exports.dateNow = dateNow;
module.exports.cryptoEncrypt = cryptoEncrypt;
module.exports.cryptoDecrypt = cryptoDecrypt;