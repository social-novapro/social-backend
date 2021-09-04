const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws')
const http = require('http')
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')
const config = require('../config.json')

const PORT = config.PORT;
const PORT_WS = config.PORT_WS;
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

app.get('/', (req, res) => {
    // res.redirect('https://interact.novapro.net/api')
    // res.redirect('http://192.168.0.122:3000/api')
    res.redirect('http://localhost:3000/api')
})

app.use('/v1', APIv1);
app.use('/v1Priv', PrivAPIv1);

// START API SITE
// app.listen(PORT, () => console.log(`API server started on port ${PORT}`))

// WEBSOCKET CODE
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log("user has connected")

    wss.clients.forEach(client => {
        if (client != ws) {
            client.send(`New user has joined the chat`);
        }    
        else {
            client.send(`You have joined the chat`)
        }
    });

    ws.isAlive = true;

    ws.on('pong', () => {
        console.log("pong")
        ws.isAlive = true;
    });

    ws.on('close', () => {
        wss.clients.forEach(client => {
            if (client != ws) {
                client.send(`A user has disconnected`);
            }    
        });
        console.log("user has disconnected")
    })
    
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        console.log(`${message} from another user`)

        wss.clients.forEach(client => {
            if (client != ws) {
                client.send(`"${message}" - another user`);
            }    
            else {
                client.send(`You sent: ${message}`)
            }
        });
    });
});

setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);

//start our server
server.listen(PORT, () => console.log(`Server started on port ${PORT}!`));