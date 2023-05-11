const { verifyEmail } = require('./verification');
const { emailSender } = require('./send');
const { setEmail, validEmail } = require('./setEmail');

module.exports = {
    verifyEmail, 
    setEmail,
    validEmail,
    emailSender
}