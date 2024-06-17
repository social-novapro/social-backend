const {v4 : uuidv4} = require('uuid');
const liveChatSchema = require('../../schemas/liveChatSchema');
const {SCHEMA_VERSIONS} = require('../../../config.json');
const { pushLiveChatMessages } = require('../../utils/pushNotifications/liveChatMessages');

async function saveChat(chatData) {
    const { _id, apiVersion, type, user  } = chatData;
    const newID = _id;

  //  await liveChatSchema.create({ _id: chatData._id, 
    switch (type) {
        case 01: // pings
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
            });
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
            });

            pushLiveChatMessages({
                title: "Interact Live Chat",
                subtitle: `New Message from @${user.username}`,
                body: chatData.message.content
            })

            break;
        case 03: // delete message
            await liveChatSchema.findOneAndDelete({ _id });
            break;
        case 04: // reactions
            
            break;
        case 05: // edit message
            console.log(chatData)
            await liveChatSchema.findOneAndUpdate({
                _id,
            }, {     
             //   _id,   
                __v: SCHEMA_VERSIONS.liveChatSchema,
                user,
                apiVersion,
                message: {
                    timeStamp: chatData.oldMessage.timeStamp,
                    content: chatData.newMessage.content,
                    edited: true,
                    editedTimeStamp: chatData.newMessage.timeStamp
                }
            }, {
                upsert: true
            });
            break;
        case 06: // user jooin
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
            });
            break;
        case 07: // user leave
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
            });
            break;
        default:
            break;
    };
};

async function sendAllChatData() {
    const all = await liveChatSchema.find();
    // const send = all.slice((all.length - 5), all.length);

  //  console.log(all.slice(- 5))
    return all.slice(- 5);
};
async function getMessage(messageID) {
    const message = await liveChatSchema.findOne({ _id: messageID });

    return message;
};

module.exports = { saveChat, sendAllChatData, getMessage };
