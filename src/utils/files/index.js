var Minio = require('minio')
require('dotenv').config({ path: 'secret.env' })

var minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_USER,
    secretKey: process.env.MINIO_PASSWORD
});

const bucketname = process.env.MINIO_BUCKET

function runtest() {
    var file = './ex/v16.png';
    console.log(file)
    minioClient.fPutObject("");

}


async function uploadFile() {
    
}

module.exports = {
    uploadFile
}