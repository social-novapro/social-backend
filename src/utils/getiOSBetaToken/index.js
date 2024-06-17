require('dotenv').config()
const { current } = require('../../../config.json');

function getiOSAppToken() {
    if (current == "prod") {
        const { IOS_APP_TOKEN_PROD } = process.env;
        return IOS_APP_TOKEN_PROD
    } else {
        const { IOS_APP_TOKEN_DEV } = process.env;
        return IOS_APP_TOKEN_DEV
    }
}

module.exports = { getiOSAppToken }