const router = require('express').Router()
const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const chatRoutes = require('./chatRoutes')
const messageRoutes = require('./messageRoutes')
const organizationsRoutes = require('./organizationRoutes')
const projectRoutes = require('./projectRoutes')
const integrationRoutes = require('./integrationRoutes')




router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/chat', chatRoutes)
router.use('/message', messageRoutes)
router.use('/organizations', organizationsRoutes)
router.use('/projects', projectRoutes)
router.use('/integrations', integrationRoutes)




module.exports = router