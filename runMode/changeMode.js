const fs = require('fs')
const configFile = require('../config.json')
const possible = ["prod", "dev"]

function changeProdMode(changeTo) {
    if (!possible.includes(changeTo)) throw " Requested environment was not valid"
    console.log(`---\nSetting up ${changeTo} environment`)
    if (configFile.current == changeTo) return true;
    
    configFile.current = changeTo;

    fs.writeFileSync('./config.json', JSON.stringify(configFile, null, 4), (err) => {
        console.log(err)
    })
}

module.exports = {
    changeProdMode
}