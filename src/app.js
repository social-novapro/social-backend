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

/*
const websocketServer = new WebSocket.Server({
    server,
    path: "/stats",
});
websocketServer.on("connection", async (ws, req) => {
    console.log('test')
});
*/
// console.log(websocketServer)



var totalUsers = 0;

const wsUtils = require('./WS/v1/utils');
const interactUserSchema = require('./schemas/interactUserSchema');
const liveChatSchema = require('./schemas/liveChatSchema');
// const { checkRequestTokens } = require('./utils/checkRequestTokens');

function sendEveryone(sendMessage) {
    wss.clients.forEach(client => {
        client.send(JSON.stringify(sendMessage));
    });
};


/*

var connections = { connected: [] };//= {"6" :"23er13", "7" :"23err1433"};
//connections.connected = [];
//connections["4"] = {"ws" : "efqef", "typing" : "typing"}

//console.log(connections["4"])

//connections["4"].test = "test"

function deleteIndex(userID) {
    var foundIndex = false
    for (var i=0; i<connections.connected.length; i++) {
        if (connections.connected[i] == userID) {
            foundIndex = true
            connections.connected.splice(i, 1);
            return {"foundIndex" : foundIndex}
        }
    }

    delete connections[`${userID}`]
    return {"foundIndex" : foundIndex}

}

function sendAllUsers(message) {
    // console.log(connections)
    for (const connected of connections.connected) {
        const connectionWS = connections[`${connected}`]
        //if (connectionWS.auth==true) {
            connectionWS.ws.send(JSON.stringify(message));
       // }
    }
}

function checkURLParams(url) {
    const params = new URLSearchParams(url);
    const userID = params.has('/?userID');

    if (userID) {
        const userIDSearch = params.get('/?userID');
        return {"param":true, paramTypes: [ {"paramName":"userID", "userID":userIDSearch}]};
    };

    return {"param":false};
};

function checkUserID(reqURL) {
    const paramsData = checkURLParams(reqURL);
    var userIDFound;

    if (paramsData.param) {
        for (const currentParam of paramsData.paramTypes) {
            userIDFound = currentParam.userID;
            if (currentParam.userID) return userIDFound;
        };
    };
    if (!defaultUserID) return {"param" : "false"};
    return defaultUserID;
};

wss.on('connection', async (ws, req) => {
    //console.log(req)
    console.log("user has connected2");
    var messageStart = {
        "type" : 10,
    }
    ws.send(JSON.stringify(messageStart))




    totalUsers++;
    console.log(totalUsers);

    console.log("user has connected");

    var userTyping = {
        typingSince: getTime(),
        typing: false
    }

    const userID = checkUserID(req.url);

    connections[`${userID}`] = {"ws" : ws, "ready": false}
    connections.connected.push(userID);

    const newJoinID = uuidv4();

    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return ws.close()

        
    const user = {
        _id: userID,
        username: userData.username,
        displayName: userData.displayName,
    };

   //  connections[`${userID}`].ws.send();

   // ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });
    

    //connection is up, let's add a simple simple event
    ws.on('message', async (message) => {
        var data
        console.log('31')

        console.log(message)
        try {
            data = JSON.parse(message);
            console.log('----')
        }
        catch (err) {
            console.log(err)
            console.log('---- err')

            return ws.send(JSON.stringify({"error": "Invalid JSON"}));
        }

        const newID = uuidv4();

        var messageSend;
        console.log(data.type)

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
                    console.log(messageOld)
                    messageSend = {
                        _id: messageOld._id,
                        type: 05,
                        user,
                        apiVersion: config.LATEST_API,
                        newMessage: {
                            postID: messageOld._id,
                            currentUsers: totalUsers,
                            content: newEdit,
                            editedTimeStamp: getTime()
                        },
                        oldMessage: {
                            postID: messageOld._id,
                            content: messageOld.message.content,
                            timeStamp: messageOld.message.timeStamp
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
            case 10: // initalConnection
            //   tokens
            //   - userID
            //   - userToken
            //   - accessToken
            //   - appToken
            //   - devToken

                console.log("ran")
                if (!data.tokens) return ws.send(JSON.stringify({'error' : "you must have a tokens object included in your message"}))
                // const tokenCheck = await checkRequestTokens({"headers" : data.tokens, "url": "live-chat"});
                //if (tokenCheck.authorized == false) return ws.send(JSON.stringify(tokenCheck));
                
                connections[`${userID}`].auth = true;
                const oldChats = await wsUtils.sendAllChatData();

                for (const chat of oldChats) {
                    console.log("chat")
                   // console.log(chat)
                    ws.send(JSON.stringify(chat));
                };

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
            
                sendAllUsers(messageSend);

                break;
            default:
                return ws.send(JSON.stringify({ "error" : "invalid message type"}));
                break;
        };

        if (!messageSend) return ws.send(JSON.stringify(searchError("H002")));
        sendAllUsers(messageSend);
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

        sendAllUsers(messageSend);
        sendAllUsers(messageSend2);

        deleteIndex(userID);
        return ws.close();
    });
});
*/

// /*
wss.on('connection', async (ws, req) => {
    totalUsers = totalUsers + 1;
    
    var userTyping = {
        typingSince: getTime(),
        typing: false
    }

   // const paramsData = checkURLParams(req.url)
    const userID = checkUserID();
    
    const newJoinID = uuidv4();

    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return ws.close()

    function checkURLParams(url) {
        const params = new URLSearchParams(url);
        const userID = params.has('/?userID');
    
        if (userID) {
            const userIDSearch = params.get('/?userID');
            return {"param":true, paramTypes: [ {"paramName":"userID", "userID":userIDSearch}]};
        };
    
        return {"param":false};
    };

    function checkUserID() {
        const paramsData = checkURLParams(req.url);
        var userIDFound;

        if (paramsData.param) {
            for (const currentParam of paramsData.paramTypes) {
                userIDFound = currentParam.userID;
                if (currentParam.userID) return userIDFound;
            };
        };
        if (!defaultUserID) return {"param" : "false"};
        return defaultUserID;
    };

   // console.log(w/s.isAlive)
    console.log(totalUsers);
    console.log("user has connected");

    const data = await wsUtils.sendAllChatData();

    for (const chat of data ) {
        ws.send(JSON.stringify(chat));
    };
        
    const user = {
        _id: userID,
        username: userData.username,
        displayName: userData.displayName,
    };

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
        const newID = uuidv4();

        var messageSend;

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
                    console.log(messageOld)
                    messageSend = {
                        _id: messageOld._id,
                        type: 05,
                        user,
                        apiVersion: config.LATEST_API,
                        newMessage: {
                            postID: messageOld._id,
                            currentUsers: totalUsers,
                            content: newEdit,
                            editedTimeStamp: getTime()
                        },
                        oldMessage: {
                            postID: messageOld._id,
                            content: messageOld.message.content,
                            timeStamp: messageOld.message.timeStamp
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
            default:
                return ws.send(JSON.stringify({ "error" : "invalid message type"}));
                break;
        };

        if (!messageSend) return ws.send(JSON.stringify(searchError("H002")));

        wss.clients.forEach(client => {
            client.send(JSON.stringify(messageSend))
        });
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