const mongoose = require('mongoose')
const { isEmail, isStrongPassword } = require('validator')
const bcrypt  = require('bcryptjs')

const Schema  = new mongoose.Schema({
    name: {
        type:String,
        min:[5, "name should be greater than 5 char"],
        max:[10, "name can not  be greater than 5 char."]
    },
    email:{
        type:String,
        required: [true, "Email required"],
        unique:true,
        validate: [isEmail,"InValid Email"]
    },
    password: {
        type:String,
        required: true,
        validate: [isStrongPassword, "Please enter strong password"],
        select: false
    },
    status:{
        type:String,
        default: 'offline'
    },
    resetPasswordToken: String,
    resePasswordExpire: Date
    
},

    { timestamps: true }
)


Schema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    
    this.password = await bcrypt.hash(this.password, 10)
})

const userModel = new mongoose.model("user", Schema)
module.exports = userModel