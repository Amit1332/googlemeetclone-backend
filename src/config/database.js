const mongoose = require('mongoose')
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../helper/messages')

const dbConnection = async () => {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
         console.log(`${SUCCESS_MESSAGES.DATABASE_CONNECTION}`)
}).catch((error) => {
         console.log(`${ERROR_MESSAGES.DATABASE_CONNECTION}`)
})
}


module.exports = dbConnection