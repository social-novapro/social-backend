const fs = require('fs')
const configFile = require('../config.json')
const possible = ["prod", "dev"]

function changeProdMode(changeTo) {
    if (!possible.includes(changeTo)) throw "Not Valid Environment"
    console.log(`---\nSetting up ${changeTo} environment`)
    if (configFile.current == changeTo) return true;
    
    configFile.current = changeTo;

    console.log(configFile)
    fs.writeFileSync('./config.json', JSON.stringify(configFile, null, 4), (err) => {
        console.log(err)
    })
}

module.exports = {
    changeProdMode
}