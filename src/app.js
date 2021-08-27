const express = require('express');
const mongoose = require('mongoose');
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

//mongoose.connect('mongodb://novauser:ladPOCKS@mongo.xnet.com:27017/Kate', {
//mongoose.connect('mongodb://192.168.0.122:27017/Kate', {

mongoose.connect('mongodb://localhost:27017/Kate', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
});



app.use(cors({
    origin: [ 'https://interact.novapro.net', 'http://localhost:5500', 'https://interact.dkravec.repl.co' ],
    // origin: ['https://interact.novapro.net'],
    // origin: ['http://192.168.0.122:3000'],
    //origin: ['https://interact.dkravec.repl.co/', 'http://localhost:3000', 'http://localhost:5500/', 'https://interact.novapro.net/' ],
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

app.listen(PORT, () => console.log(`Running on Port ${PORT}`))
