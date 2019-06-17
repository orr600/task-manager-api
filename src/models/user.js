const mongoose=require('mongoose')
const validator=require('validator')
const bcryptjs=require('bcryptjs')
const jwt= require("jsonwebtoken")
const Task=require('../models/task.js')

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    
    },
    email:{
        type:String,
        unique:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("This email is not valid")
            }
        }
    },
    password:{
        type:String,
        minlength:7,
        trim:true,
        required:true,
        validate(value){
            if(validator.contains(value.toLowerCase(),"password")){
                throw new Error("The password must not contain the word 'password'")
            }
        }
    },
    age:{
        type:Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error("Age must be a positive num!")
            }
        }
    },
    tokens: [{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type: Buffer
    }
    },{
        timestamps:true
    })

    userSchema.virtual('tasks',{
        ref:'Task',
        localField: '_id',
        foreignField:'owner'

    })
    userSchema.methods.toJSON= function() {
        const user=this.toObject()
        delete user.password
        delete user.tokens
        delete user.avatar
        return user
    }
    userSchema.methods.generateAuthToken= async function() {
        const user=this
        const token= jwt.sign({'_id':user._id.toString()},  process.env.JWT_SECRET)
        user.tokens = user.tokens.concat({token})
        await user.save()
        return token
    }

    userSchema.statics.findByCredentials= async (email,password)=>{
        
        const user= await User.findOne({email})
        
        if(!user){
            throw new Error ("Unable to login")
        }
        const isMatch= await bcryptjs.compare(password,user.password)
        if(!isMatch){
            throw new Error ("Unable to login")
        }
        return user
    } 

    userSchema.pre('remove', async function(next){
        const user=this
        await Task.deleteMany({owner:user._id})
        next()
        })

userSchema.pre('save', async function(next){
const user=this
if(user.isModified('password')){
    user.password= await bcryptjs.hash(user.password,8)
}
next()
})

const User=mongoose.model('User',userSchema)

module.exports=User