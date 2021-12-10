const {v4 : uuidv4} = require('uuid')
const liveChatSchema = require('../../schemas/liveChatSchema')
const {SCHEMA_VERSIONS} = require('../../../config.json')

async function saveChat(chatData) {
    const newID = uuidv4()
    const { type, apiVersion } = chatData

    switch (type) {
        case 01:
            await liveChatSchema.findOneAndUpdate({
                _id: newID
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                apiVersion,
                pings: chatData.pings
            }, {
                upsert: true
            }) 
            break;
        case 02:
            await liveChatSchema.findOneAndUpdate({
                _id: newID
            }, {        
                _id: newID,
                __v: SCHEMA_VERSIONS.liveChatSchema,
                type,
                apiVersion,
                message: chatData.message
            }, {
                upsert: true
            }) 
            break;
        case 03:
            
            break;
        case 04:
            
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
    return all
}

module.exports = { saveChat, sendAllChatData }
