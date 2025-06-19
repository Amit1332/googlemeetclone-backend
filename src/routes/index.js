const router = require('express').Router()
const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const chatRoutes = require('./chatRoutes')
const messageRoutes = require('./messageRoutes')



router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/chat', chatRoutes)
router.use('/message', messageRoutes)



module.exports = router