const {v4 : uuidv4} = require('uuid')
const liveChatSchema = require('../../schemas/liveChatSchema')
const {SCHEMA_VERSIONS} = require('../../../config.json')

async function saveChat(chatData) {
    const { _id, apiVersion, type, user  } = chatData
    const newID = _id

  //  await liveChatSchema.create({ _id: chatData._id, 
    switch (type) {
        case 01:
            await liveChatSchema.findOneAndUpdate({
                _id: newID
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                user,
                apiVersion,
                pings: chatData.pings
            }, {
                upsert: true
            }) 
            break;
        case 02: // post message
            await liveChatSchema.findOneAndUpdate({
                _id,
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                user,
                apiVersion,
                message: chatData.message
            }, {
                upsert: true
            }) 
            break;
        case 03: // delete message
            await liveChatSchema.findOneAndDelete({ _id })
            break;
        case 04: // edit message
            
            break;
        case 05:
            
            break;
        case 06:
            await liveChatSchema.findOneAndUpdate({
                _id: newID
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                user,
                apiVersion,
                userJoin: chatData.userJoin
            }, {
                upsert: true
            }) 
            break;
        case 07:
            await liveChatSchema.findOneAndUpdate({
                _id: newID
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                user,
                apiVersion,
                userLeave: chatData.userLeave
            }, {
                upsert: true
            }) 
            break;
        default:
            break;
    }
    
}

async function sendAllChatData() {
    const all = await liveChatSchema.find()
    const send = all.slice((all.length - 5), all.length)

  //  console.log(all.slice(- 5))
    return all.slice(- 5)
}

module.exports = { saveChat, sendAllChatData }
