const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')

const RootSchema = require('./graphql')
const config = require('../config.json')
const app = express();
const PORT = config.PORT;
const APIv1 = require('./APIv1');
const {v4 : uuidv4} = require('uuid')

// generate new unique ID
// console.log(uuidv4())


app.use(express.json());
app.use(express.urlencoded({extended: false}))

//mongoose.connect('mongodb://novauser:ladPOCKS@mongo.xnet.com:27017/Kate', {
mongoose.connect('mongodb://localhost:27017/Kate', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
});

app.use(cors({
    // origin: ['https://interact.novapro.net'],
    // origin: ['http://192.168.0.122:3000'],
    origin: ['http://localhost:3000'],
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

app.listen(PORT, () => console.log(`Running on Port ${PORT}`))
