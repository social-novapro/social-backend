require('dotenv').config({ path: 'secret.env' })

const requiredEnvs = [
    "email_user",
    "email_pass",
    "MONGO_URL_PROD",
    "MONGO_URL_DEV",
    "MINIO_USER",
    "MINIO_PASSWORD",
    "MINIO_BUCKET",
    "MINIO_ROOT_USER",
    "MINIO_ROOT_PASSWORD",
    "PUSH_KEY_ID",
    "PUSH_TEAM_ID",
    "PUSH_AUTH_KEY_NAME",
    "PUSH_BUNDLE_IDENTIFIER",
    "PUSH_PRODUCTION",
    "IOS_APP_TOKEN_PROD",
    "IOS_APP_TOKEN_DEV",
    "trakt_client_id",
    "trakt_client_secret",
    "EMBED_API_DEV_ROUTE",
    "EMBED_API_PROD_ROUTE"
]

function verifyEnvs() {
    for (const env of requiredEnvs) {
        const foundEnv = process.env[env]
        if (!foundEnv) {
            console.log(`Missing key : ${env}`)
            throw `Required key was not found`
        };

        console.log(`---\nKey ${env} was found.`)

    }
}

verifyEnvs()