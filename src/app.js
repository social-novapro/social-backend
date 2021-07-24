const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')


const RootSchema = require('./graphql')
const config = require('../config.json')
const app = express();
const PORT = config.PORT;


mongoose.connect('mongodb://novauser:ladPOCKS@mongo.xnet.com:27017/Kate', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
});


app.use(cors({
    // origin: ['https://interact.novapro.net'],
    origin: ['http://192.168.0.122:3000'],
    credentials: true
}))


app.use('/graphql', graphqlHTTP({
    graphiql: true,
    schema: RootSchema,
}))


app.listen(PORT, () => console.log(`Running on Port ${PORT}`))
