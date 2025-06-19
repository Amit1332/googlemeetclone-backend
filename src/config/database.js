const mongoose = require('mongoose')
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../helper/messages')

const dbConnection = async () => {
    await mongoose.connect('mongodb+srv://amitsinghpatel9747:bNFQz8kfIZBFcSsn@cluster0.tpywbad.mongodb.net/meetclone?retryWrites=true&w=majority').then(() => {
         console.log(`${SUCCESS_MESSAGES.DATABASE_CONNECTION}`)
}).catch((error) => {
         console.log(`${ERROR_MESSAGES.DATABASE_CONNECTION}`)
})
}


module.exports = dbConnection