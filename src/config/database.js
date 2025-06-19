const mongoose = require('mongoose')
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../helper/messages')

const dbConnection = async () => {
  try {
    await mongoose.connect('mongodb+srv://amitsinghpatel9747:bNFQz8kfIZBFcSsn@cluster0.tpywbad.mongodb.net/meetclone?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = dbConnection