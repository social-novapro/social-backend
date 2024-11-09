const { current } = require("../../../config.json");
if (current == "dev") {
    console.log("Logging development mode");
}

// actually, dont need
async function logError({ error, location }) {
    console.error(`Error at ${location}: ${error}`);
}

// useful for debugging
async function logData(/*location, ignoreDev,*/ ...data) {
    if (current == "prod"/* && ignoreDev*/) return;
    console.log(...data);
    return;
}

module.exports = { logError, logData };