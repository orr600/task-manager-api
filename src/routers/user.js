
const express= require("express")
const User=require('../models/user.js')
const router = new express.Router()
const auth=require('../middleware/auth.js')
const multer= require('multer')
const sharp= require('sharp')
const {sendWelcomeMail,sendCancelationMail}= require('../email/account')



router.post('/users',async(req,res)=>{
   
    const user=new User(req.body)
    try{
        const token = await user.generateAuthToken()
        sendWelcomeMail(user.email,user.name)
       res.status(201).send({user,token});
    }
   catch(error){
       res.status(400).send(error)
   }
})

router.post('/users/login', async (req,res)=>{
   
    try{
        
        const user= await User.findByCredentials(req.body.email, req.body.password)
        
        const token = await user.generateAuthToken()
        res.send({user,token})
    }
    catch(e){
        res.status(400).send(e)
    }
 })

 router.post('/users/logout',auth, async (req,res)=>{
   
    try{
        req.user.tokens= req.user.tokens.filter((token)=>{
            return req.token !== token.token
        })
        await req.user.save()

        res.send()
    }
    catch(e){
        res.status(500).send(e)
    }
 })

 router.post('/users/logoutAll',auth, async (req,res)=>{
   
    try{
        req.user.tokens= []
        
        await req.user.save()

        res.send()
    }
    catch(e){
        res.status(500).send(e)
    }
 })


 

router.get('/users/me',auth,async(req,res)=>{
   
       res.send(req.user)
})

router.get('/users/:id',async(req,res)=>{
   try{
       const user=await User.findById(req.params.id)
       
       if(!user){
           return res.status(404).send()
       }
       res.send(user)
   }
  catch(e){
       res.status(500).send(e)
   }
})

router.patch('/users/me',auth, async (req,res)=>{
   const allowedUpdates=['name','age','password','email']
   const updates= Object.keys(req.body)
   const isValidOperation = updates.every((update)=>{ return allowedUpdates.includes(update) })
   if(!isValidOperation){
       return res.status(400).send({error:"invalid updates"})
   }
   try{
    
    updates.forEach((update)=>{req.user[update]=req.body[update]})
    
    await req.user.save()
    
       //const user= await User.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true})
       res.send(req.user)
   }
   catch(e){
       res.status(500).send(e)
   }
})

router.delete('/users/me',auth, async (req,res)=>{
   
   try{
      req.user.remove()
      sendCancelationMail(req.user.email,req.user.name)
       res.send(req.user)
   }
   catch(e){
       res.status(500).send(e)
   }
})


const upload= multer({
    limits:{
        fileSize: 1600000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload a jpg/jpeg/png image'))
        }
        cb(undefined,true)
    }
})


router.post('/users/me/avatar',auth,upload.single('avatar'), async (req,res)=>{
   const buffer= await sharp(req.file.buffer).resize({height:400,width:250}).png().toBuffer()
   req.user.avatar=buffer
   await req.user.save()
   res.send()
 },(error,req,res,next)=>{
     res.status(400).send({error:error.message})
 })

 router.delete('/users/me/avatar',auth, async (req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send()
  })

  router.get('/users/:id/avatar', async (req,res)=>{
   try{
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
        throw new Error()
    }
    res.set('Content-Type','image/png')
    res.send(user.avatar)
   }
   catch(e){
    res.status(404).send()
   }
  })



module.exports= router