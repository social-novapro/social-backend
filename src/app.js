const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const config = require('../config.json');
const PORT = config.PORT;
const app = express();
const RootSchema = require('./graphql');
const APIv1 = require('./APIs/v1');
const PrivAPIv1 = require('./APIs/v1Priv');
const {v4 : uuidv4} = require('uuid');
const {searchError} = require('./utils/searchError');

/* collect everything within a index
const interactPostSchema = require('./database/posts-schema')

async function test() {
    const data1 =  await interactPostSchema.find()
    console.log(data1)   
}
test()*/

app.use(express.json());
app.use(express.urlencoded({extended: false}));

var mongoURL

if (config.current == "dev") mongoURL = config.dev.mongo_url;
else mongoURL = config.prod.mongo_url;

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
});

/*
const developerAppToken = require('./schemas/developer/developerAppToken');
const developerToken = require('./schemas/developer/developerToken');
const interactUserPrivSchema = require('./schemas/interactUserPrivSchema');
const {SCHEMA_VERSIONS} = require('../config.json');

createTokens()

async function createTokens() {
    function checktime() {
        var d = new Date();
        const timeMS = d.getTime();
    
        return timeMS;
    };
    
    await developerToken.findOneAndUpdate({
        _id: "6292d8ae-8c33-4d46-a617-4ac048bd6f11"
    }, {        
        _id: "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
        __v: SCHEMA_VERSIONS.developerToken,
        creationTimestamp: checktime(),
        userID: "main",
        premium: false,
        APIuses: 0
    }, {
        upsert: true
    });
    
    await interactUserPrivSchema.findOneAndUpdate({
        _id: "main"
    }, { devToken: "6292d8ae-8c33-4d46-a617-4ac048bd6f11" });
    
    await developerAppToken.findOneAndUpdate({
        _id: "3610b8af-81c9-4fa2-80dc-2e2d0fd77421"
    }, {        
        _id: "3610b8af-81c9-4fa2-80dc-2e2d0fd77421",
        __v: SCHEMA_VERSIONS.developerAppToken,
        userID: "main",
        devToken: "6292d8ae-8c33-4d46-a617-4ac048bd6f11",
        APIUses: 0,
        creationTimestamp: checktime(),
    }, {
        upsert: true
    });
}
*/

app.use(cors({
    origin: [ 
        'https://interact.novapro.net', 
        'http://localhost:5500', 
        'https://interact.dkravec.repl.co',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'https://interact-analytics.novapro.net'
    ],
    credentials: true
}));

app.use('/graphql', graphqlHTTP({
    graphiql: true,
    schema: RootSchema,
}));

/*
app.get('/', (req, res) => {
    // res.redirect('https://interact.novapro.net/api')
    // res.redirect('http://192.168.0.122:3000/api')
    res.redirect('http://localhost:3000/api')
})*/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/apiDocs', (req, res) => {
    res.sendFile(__dirname + '/APIs/apidocs.json');
});
app.get('/apiDocsJS', (req, res) => {
    res.sendFile(__dirname + '/APIs/apidocs.js');
});
app.use('/v1', APIv1);
app.use('/v1Priv', PrivAPIv1);


// START API SITE
// app.listen(PORT, () => console.log(`API server started on port ${PORT}`))
function getTime() {
    const d = new Date();
    const currentTime = d.getTime();
    return currentTime;
};

// WEBSOCKET CODE
const server = http.createServer(app);
 //const WebSocketRoute = require('./WS')
// app.use('/ws',WebSocketRoute 
const wss = new WebSocket.Server({server});
// const wsM = new WebSocket.Server({ server });

// /*
// const websocketServer = new WebSocket.Server({
//     server,
//     path: "/stats",
// });
// console.log(websocketServer)


// websocketServer.on('connection', async (ws, req) => {
//     ws.send("hi")
//     console.log("welcome")
// })


// module.exports = { websocketServer }

// */
// console.log(websocketServer)



var totalUsers = 0;

const wsUtils = require('./WS/v1/utils');
const dmUtils = require('./WS/v1/dms');

const interactUserSchema = require('./schemas/interactUserSchema');
const liveChatSchema = require('./schemas/liveChatSchema');
const { checkRequestTokens } = require('./utils/checkRequestTokens');
// const { checkRequestTokens } = require('./utils/checkRequestTokens');

function sendEveryone(sendMessage) {
    wss.clients.forEach(client => {
        client.send(JSON.stringify(sendMessage));
    });
};

function checkURLParams(url) {
    const params = new URLSearchParams(url);
    const userID = params.has('/?userID');

    if (userID) {
        const userIDSearch = params.get('/?userID');
        return {"param":true, paramTypes: [ {"paramName":"userID", "userID":userIDSearch}]};
    };

    return {"param":false};
};

function checkUserID(req) {
    const paramsData = checkURLParams(req.url);
    var userIDFound;

    if (paramsData.param) {
        for (const currentParam of paramsData.paramTypes) {
            userIDFound = currentParam.userID;
            if (currentParam.userID) return userIDFound;
        };
    };
    if (!userIDFound) return false;
    return userIDFound;
};


var connections = {
    connectedUsers: [],
    users: {}
    /*
    connectedUsers: ["userID", "userID2"],
    users: {
        "userID" : {
            username: "username",
            userID: "userID",
            displayName: "display name",
            tokensCorrect: true,
            timestamp: 1434,
            typing : false,
            typingSince : 0
        },
        "userID2" : {
            tokensCorrect: true,
            timestamp: 245,
            typing: true,
            typingSince: 246
        }
    }
    */
}

function updateCurrentUser(currentUser) {
    connections.users[`${currentUser.userID}`] = currentUser
}

wss.on('connection', async (ws, req) => {
    totalUsers = totalUsers + 1;
    
    const userID = checkUserID(req);
    if (!userID) {
        const messageError = {
            content: "You have not included a userID in the url connection."
        }
        ws.send(JSON.stringify(messageError))
        return ws.close()
    }
    const newJoinID = uuidv4();

    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) {
        const messageError = {
            content: "You have not included a valid userID in the url connection."
        }
        ws.send(JSON.stringify(messageError))
        return ws.close()
    }

    console.log(`user has connected, ${totalUsers} total connected.`);


    const data = await wsUtils.sendAllChatData();

    for (const chat of data ) {
        ws.send(JSON.stringify(chat));
    };
        
    /*
        getPrevious
    */
    const user = {
        _id: userID,
        username: userData.username,
        displayName: userData.displayName,
    };

    var currentUser = {
        userID: userData._id,
        username: userData.username,
        displayName: userData.displayName,
        timestampConnected: getTime(),
        tokensCorrect: false,
        // typing : false,
    }

    updateCurrentUser(currentUser)
    // connections.users[`${userData._id}`] = currentUser
    // console.log(connections)
    
    ws.send(JSON.stringify({
        type: 10,
        user,
        message: "please connect",
        mesType: 1
        /*
            1: please connect
            2: token sending
            3: error
            4: success
        */
    }))

    var messageSend = {
        _id: newJoinID,
        type: 06,
        user,
        apiVersion: config.LATEST_API,
        userJoin: {
            userID,
            currentUsers: totalUsers,
            content: `${user.displayName} has joined the chat`,
            timeStamp: getTime()
        }
    };

    wss.clients.forEach(client => {
        client.send(JSON.stringify(messageSend));
    });

    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('close', () => {
        totalUsers = totalUsers -  1;
        const newID = uuidv4();

        var messageSend = {
            _id: newID,
            type: 07,
            apiVersion: config.LATEST_API,
            user,
            userLeave: {
                userID: userID,
                currentUsers: totalUsers,
                content: `${user.displayName} has disconnected`,
                timeStamp: getTime()
            }
        };
        
        var messageSend2 = {
            type: 09,
            user,
            apiVersion: config.LATEST_API,
            userTyping: false
        };

        wss.clients.forEach(client => {
            client.send(JSON.stringify(messageSend));
            client.send(JSON.stringify(messageSend2));
        });

        ws.close();
    });

    //connection is up, let's add a simple simple event
    ws.on('message', async (message) => {
        var data

        try {
            data = JSON.parse(message);
        }
        catch {
            console.log(err)
            ws.send(JSON.stringify({"error": "Invalid JSON"}));
        }

        if (!currentUser.tokensCorrect) {
            if (data.type == 10 && data.mesType == 2) {
                /*
                headers
                    userid
                    devtoken
                    apptoken
                    usertoken
                    accesstoken
                */
                const req = {
                    baseUrl: "/websocket",
                    originalUrl: "/ws",
                    headers: data.tokens 
                };

                if (!data.tokens) return;
                if (data.tokens.userid != userID) return ws.close();

                const tokenData = await checkRequestTokens(req);
                if (tokenData.authorized == false) {
                    messageError = {
                        // _id: newID,
                        type: 10,
                        user,
                        apiVersion: config.LATEST_API,
                        mesType: 3,
                        success: false,
                    };
                    return ws.send(JSON.stringify(messageError))
                } else {
                    messageGood = {
                        // _id: newID,
                        type: 10,
                        user,
                        mesType: 4,
                        success: true
                    };

                    ws.send(JSON.stringify(messageGood));

                    currentUser.tokensCorrect = true;
                    updateCurrentUser(currentUser);
                }
            }
            else {
                messageError = {
                    // _id: newID,
                    type: 02,
                    user,
                    apiVersion: config.LATEST_API,
                    message: {
                        userID,
                        currentUsers: totalUsers,
                        content: "No tokens has been sent.",
                        timeStamp: getTime(),
                        edited: false
                    }
                };
                return ws.send(JSON.stringify(messageError))
            }
            return
        }
        else {
            var messageSend;
        
            const newID = uuidv4();
            switch (data.type) {
                case 2:
                    messageSend = {
                        _id: newID,
                        type: 02,
                        user,
                        apiVersion: config.LATEST_API,
                        message: {
                            userID,
                            currentUsers: totalUsers,
                            content: data.message.content,
                            timeStamp: getTime(),
                            replyTo: data.message.replyTo? data.message.replyTo : null,
                            edited: false
                        }
                    };

                    wsUtils.saveChat(messageSend);
                    break;
                case 3:
                    const messageDeleteCheck = await liveChatSchema.findOne({ _id: data.messageToDelete });

                    if (!messageDeleteCheck) {
                        return ws.send(JSON.stringify({ "error" : `no message`}));
                    } else if (!messageDeleteCheck.user) { 
                        return ws.send(JSON.stringify({ "error" : `no user`}));
                    } else if (messageDeleteCheck.user._id != userID) {
                        return ws.send(JSON.stringify(searchError("H001")));
                    } else if (messageDeleteCheck.user._id == userID) {
                        messageSend = {
                            _id: data.messageToDelete,
                            type: 03,
                            user,
                            apiVersion: config.LATEST_API,
                            deleteMessage: {
                                content: messageDeleteCheck.content,
                                timeStamp: getTime()
                            }
                        }

                        wsUtils.saveChat(messageSend)
                    };
                    break;
                case 05: 
                    if (!data.editMessage) return ws.send(JSON.stringify({'error' : "you must have a editMessage object included in your message"}))
                    if (!data.editMessage.postID) return ws.send(JSON.stringify({"error" : "you must have a postID inside your editMessage object"}))
                    const messageOld = await liveChatSchema.findOne({ _id: data.editMessage.postID });

                    if (!messageOld) {
                        return ws.send(JSON.stringify({"error" : `no message`}));
                    } else if (!messageOld.user) {
                        return ws.send(JSON.stringify({"error" : `no user`}));
                    } else if (messageOld.user._id != userID) {
                        return ws.send(JSON.stringify(searchError("H001")));
                    } else if (messageOld.user._id == userID) {
                        const newEdit = data.editMessage.content
                        messageSend = {
                            _id: messageOld._id,
                            type: 05,
                            user,
                            apiVersion: config.LATEST_API,
                            // message (same content) 
                            /*
                            message
                                postID
                                replyTo
                                timeStamp
                                editedTimestamp

                            newContent: newEdit
                            
                            originalContent: content
                            
                            save new mongo soon
                            */
                            newMessage: {
                                postID: messageOld._id, // dont need after
                                currentUsers: totalUsers, // dont need
                                content: newEdit,
                                editedTimeStamp: getTime()
                                // add replying
                            },
                            oldMessage: {
                                postID: messageOld._id, // dont need after
                                content: messageOld.message.content,
                                timeStamp: messageOld.message.timeStamp//dont need after
                                // add replying
                            }
                        };
                        wsUtils.saveChat(messageSend)
                    };
                    break;
                case 08:
                    //if (userTyping.typing == true) return 
                    messageSend = {
                        type: 08,
                        user,
                        apiVersion: config.LATEST_API,
                        userTyping: true
                    };
                    //userTyping.typing = true
                    break;
                case 09:
                    //if (userTyping.typing == false) return
                    messageSend = {
                        type: 09,
                        user,
                        apiVersion: config.LATEST_API,
                        userTyping: false
                    };
                    //userTyping.typing = true
                    break;
                case 10: 
                    errorMessage = {
                        type: 10,
                        user,
                        apiVersion: config.LATEST_API,
                        success: false,
                        error: "already connected"
                    }
                    break;
                // errors
                case 101:
                    errorMessage = {
                        type: 101,
                        user,
                        apiVersion: config.LATEST_API,
                        error: "no messageID included"
                    }
                    if (!data.messageID) {
                        messageSend = errorMessage
                    }
                    else {
                        const messageFound = wsUtils.getMessage(data?.postID)
                        if (!messageFound) messageSend = errorMessage
                        else messageSend = messageFound
                    }
                    break;
                // dms
                case 200: // send message
                    // content, groupID
                    var privateMessage = {

                    }

                    break;
                case 201: 
                    
                    break;
               
                default:
                    return ws.send(JSON.stringify({ "error" : "invalid message type"}));
                    break;
            };

            if (messageSend) {
                wss.clients.forEach(client => {
                    client.send(JSON.stringify(messageSend))
                });
            }
            // return ws.send(JSON.stringify(searchError("H002")));
        };
    });
});

// */
/* 
area of code is breaking for some reason

setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);
*/

/*
function sendAllUsers(allUsers, currentUser) {

}
*/

//start our server

server.listen(PORT, () => console.log(`Server started on port ${PORT}!`));