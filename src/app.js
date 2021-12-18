const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws')
const http = require('http')
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')
const config = require('../config.json')
const PORT = config.PORT;
const app = express();
const RootSchema = require('./graphql')
const APIv1 = require('./APIs/v1');
const PrivAPIv1 = require('./APIs/v1Priv')

/* collect everything within a index
const interactPostSchema = require('./database/posts-schema')

async function test() {
    const data1 =  await interactPostSchema.find()
    console.log(data1)   
}
test()*/

app.use(express.json());
app.use(express.urlencoded({extended: false}))

// mongoose.connect('mongodb://novauser:ladPOCKS@mongo.xnet.com:27017/Kate', {
// mongoose.connect('mongodb://192.168.0.132:27017/Kate', {
mongoose.connect('mongodb://localhost:27017/Kate', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
});

app.use(cors({
    origin: [ 
        'https://interact.novapro.net', 
        'http://localhost:5500', 
        'https://interact.dkravec.repl.co'
    ],
    credentials: true
}))

app.use('/graphql', graphqlHTTP({
    graphiql: true,
    schema: RootSchema,
}))

/*
app.get('/', (req, res) => {
    // res.redirect('https://interact.novapro.net/api')
    // res.redirect('http://192.168.0.122:3000/api')
    res.redirect('http://localhost:3000/api')
})*/

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})
app.get('/apiDocs', (req, res) => {
    res.sendFile(__dirname + '/APIs/apidocs.json');
})
app.get('/apiDocsJS', (req, res) => {
    res.sendFile(__dirname + '/APIs/apidocs.js');
})
app.use('/v1', APIv1);
app.use('/v1Priv', PrivAPIv1);

// START API SITE
// app.listen(PORT, () => console.log(`API server started on port ${PORT}`))
function getTime() {
    const d = new Date();
    const currentTime = d.getTime()
    return currentTime
}

// WEBSOCKET CODE
const server = http.createServer(app);
 //const WebSocketRoute = require('./WS')
// app.use('/ws',WebSocketRoute 
const wss = new WebSocket.Server({ server });

var totalUsers = 0

const wsUtils = require('./WS/v1/utils')

function sendEveryone(sendMessage) {
    wss.clients.forEach(client => {
        client.send(JSON.stringify(sendMessage))
    })
}

wss.on('connection', async (ws) => {
    totalUsers = totalUsers + 1

   // console.log(ws.isAlive)
    console.log(totalUsers)
    console.log("user has connected")

    const data = await wsUtils.sendAllChatData()

    for (const chat of data ) {
        ws.send(JSON.stringify(chat))
    }

    var messageSend = {
        type: 06,
        apiVersion: config.LATEST_API,
        userJoin: {
            userID: "unknown",
            user: "otherUser",
            currentUsers: totalUsers,
            content: "A new user has joined the chat",
            timeStamp: getTime()
        }
    }
    var messageSendOwn = {
        type: 06,
        apiVersion: config.LATEST_API,
        userJoin: {
            userID: "unknown",
            user: "ownUser",
            currentUsers: totalUsers,
            content: "You joined the chat!",
            timeStamp: getTime()
        }
    }

    // wsUtils.saveChat(messageSend)
   //  sendEveryone(messageSend)
   
    wss.clients.forEach(client => {
        if (client != ws) {
            client.send(JSON.stringify(messageSend))
        }    
        else {
            client.send(JSON.stringify(messageSendOwn))
        }
    });

    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('close', () => {
        totalUsers = totalUsers -  1
        const messageSend = {
            type: 07,
            apiVersion: config.LATEST_API,
            userLeave: {
                userID: "unknown",
                user: "otherUser",
                currentUsers: totalUsers,
                content: "A user has disconnected",
                timeStamp: getTime()
            }
        }
        
       //  wsUtils.saveChat(messageSend)

        wss.clients.forEach(client => {
            if (client != ws) {
                client.send(JSON.stringify(messageSend))
            }
        });
    })
    
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        console.log(message)
        const data = JSON.parse(message)

        var messageSend = {
            type: 02,
            apiVersion: config.LATEST_API,
            message: {
                userID: "unknown",
                user: "otherUser",
                currentUsers: totalUsers,
                content: data.message.content,
                timeStamp: getTime()
            }
        }
        var messageSendOwn = {
            type: 02,
            apiVersion: config.LATEST_API,
            message: {
                userID: "unknown",
                user: "ownUser",
                currentUsers: totalUsers,
                content: data.message.content,
                timeStamp: getTime()
            }
        }

        wsUtils.saveChat(messageSend)

        if (data.type == 02) {
            wss.clients.forEach(client => {
                if (client != ws) {
                    client.send(JSON.stringify(messageSend))
                }    
                else {
                    client.send(JSON.stringify(messageSendOwn))
                }
            });
        }
    });
});


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