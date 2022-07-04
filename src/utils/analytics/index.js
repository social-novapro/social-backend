const interactUserAnalyticSchema = require('../../schemas/analytics/interactUserAnalyticSchema/')
const { v4: uuidv4 } = require('uuid')

function getTime() {
    const d = new Date();
    const currentTime = d.getTime()
    return currentTime
}

async function analytics(req) {
    /*
    if (req.url==='live-chat') {
        await interactUserAnalyticSchema.findOneAndUpdate(
            { _id: req.headers.userid }, 
            { $push : { "userConnections" : { _id: uuidv4(), timestamp: getTime(), api_urlbase: req.url, api_url: req.url  } }
            }, { upsert: true }
        )
        return console.log('live-chat')
    }
    */

    // console.log(req.baseUrl)
    // console.log(req.headers.userid)
    // console.log(req.originalUrl)
    // console.log(req.headers)
    await interactUserAnalyticSchema.findOneAndUpdate(
        { _id: req.headers.userid }, 
        { $push : { "userConnections" : { _id: uuidv4(), timestamp: getTime(), api_urlbase: req.baseUrl, api_url: req.originalUrl  } }
        }, { upsert: true }
    )
}

module.exports = { analytics };