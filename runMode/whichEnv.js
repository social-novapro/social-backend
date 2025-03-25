const { current } = require('../config.json')

function whichEnv() {
    return `env/${current=="prod" ? "prod" : "dev" }.env`
}

module.exports = { whichEnv }