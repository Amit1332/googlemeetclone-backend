const mongoose = require('mongoose')
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../helper/messages')

const dbConnection = async () => {
    await mongoose.connect('mongodb://localhost:27017/meetclone').then(() => {
         console.log(`${SUCCESS_MESSAGES.DATABASE_CONNECTION}`)
}).catch((error) => {
         console.log(`${ERROR_MESSAGES.DATABASE_CONNECTION}`)
})
}


module.exports = dbConnection