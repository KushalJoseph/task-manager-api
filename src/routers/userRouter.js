const express=require('express');
const router=new express.Router();
const User=require('../models/user');
const Tasks=require('../models/task');
const auth=require('../middleware/auth');
const multer=require('multer');
const sharp=require('sharp');

//Create new user
router.post('/users',async(request,response)=>{
    const newUser=new User(request.body);
    try{
        await newUser.save();
        const token=await newUser.generateAuthToken();
        return response.status(201).send({user:newUser,token});
    }catch(e){
        return response.status(500).send({e});
    }
});
//Get my profile
router.get('/users/me',auth,async(request,response)=>{
    try{
        response.status(200).send(request.user);
    }catch(e){
        return response.status(500).send({error:e});
    }
});

//Update user by id
router.patch('/users/me',auth,async(request,response)=>{
    const updates=Object.keys(request.body);
    const allowedUpdates=["name","age","email","password"];
    let flag=0;
    updates.forEach((update)=>{
        if(!allowedUpdates.includes(update)){
            flag=1;
        }
    });
    if(flag==1){
        return response.status(400).send({error:"Invalid updates"});
    }
    try{
        /*const user=await User.findByIdAndUpdate(request.params.id,
            request.body,
            {new:true,runValidators:true}
        ); //new:true sends back the updated version.*/
        // We removed this because findByIdAndUpdate BYPASSES middleware.
        const user=request.user;
        if(!user){
            response.status(404).send({message: "No user found"});
        }else{
            updates.forEach(async(update)=>{
                user[update]=request.body[update]; 
                //We dont know is it user.name/ user.email etc, so we can just access
                //user."x" where x is a variable by using bracket notation. Same is done on RHS
                await user.save();
            });
            response.status(501).send(user);
        }
    }catch(e){
        return response.send(404).send({error: "Could not find User!"});
    }
});
//Delete user by id
router.delete('/users/me',auth,async(request,response)=>{
    try{
        await request.user.delete();
        await Tasks.deleteMany({createdBy:request.user._id});
        response.status(200).send(request.user);
    }catch(e){
        return response.status(500).send({"error":"something went wrong!"});
    }
});
//Login - no need auth
router.post('/users/login',async(request,response)=>{
    try{
        const user=await User.findByCredentials(request.body.email,request.body.password); 
        //Created a separate method for this in the User class.
        const tokenReceived=await user.generateAuthToken();
        response.status(200).send({user,tokenReceived});//Shorthand syntax
        console.log("Token sent while login: ",tokenReceived);
    }catch(e){
        response.status(400).send("Incorrect credentials!");
    }
});
//Logout
router.post('/users/logout',auth,async(request,response)=>{
    try{
        //Request.token-->The one we want to remove.
        //If token.token==request.token, it is not the one, and we keep it
        //If token.token!=request.token, false, it is removed.
        //Filter returns an array. Here values returned are the ones NOT equal to the token. Hence effectively, the token is deleted.
        /*request.user.tokens.filter((token)=>{
            return (token.token!=request.token);
        });*/
        request.user.tokens.forEach((token)=>{
            if(token.token==request.token){
                const index=request.user.tokens.indexOf(token);
                console.log(token);
                if(index!=-1)request.user.tokens.splice(index,1);
            }
        })
        await request.user.save();
        response.status(200).send();
    }catch(e){
        response.status(501).send(e.toString());
    }
});
//Logout from all tokens
router.post('/users/logoutAll',auth,async(request,response)=>{
    try{
        request.user.tokens=[];
        await request.user.save();
        response.status(200).send();
    }catch(e){
        return response.status(501).send({error:e});
    }
});

const upload=multer({
    dest:'images',
    limits:{
        fileSize:1000000
    },
    fileFilter(request,file,callback){
        /*if(!file.originalname.endsWith('.pdf')){
            callback(new Error("Please upload a pdf file!"));
        }
        callback(undefined,true);// #remember.*/
        if(!file.originalname.match(/\.(doc|docx)$/)){
            callback(new Error("Please provide word file!"));
        }
        callback(undefined,true);
    }
});
const profilepics=multer({
    //dest:'images/profilepics',
    //Removing 'dest' allows us to access the upload inside the route function
    limits:{
        fileSize:2000000
    },
    fileFilter(request,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error("Please upload only images"));
        }
        cb(undefined,true);
    }
})

//Upload Documents
router.post('/upload',upload.single('imageSent'),(request,response)=>{
    response.send();
},(error,request,response,next)=>{
    response.status(400).send({error:error.toString()});
});

//Upload Profile Picture
router.post('/users/me/profilepic',auth,profilepics.single('profilepic'),async(request,response)=>{
    const buffer=await sharp(request.file.buffer).resize({width:300,height:300}).png().toBuffer();
    //const buffer=request.file.buffer;
    //Now we can access the upload
    request.user.profile=buffer;//Accessed from request.file.
    await request.user.save();
    response.send();
},(error,request,response,next)=>{
    response.status(400).send({error:error.toString()});
});

router.delete('/users/me/profilepic',auth,async(request,response)=>{
    const user=request.user;
    user.profile=null;
    await user.save(); //Never forget!
    response.send(); //Never forget!
});

router.get('/users/:id/profilepic',async(request,response)=>{
    try{
        const user=await User.findById(request.params.id); //DONT FORGET AWAIT
        if(!user){
            return response.send(404);
        }
        if(!user.profile){
            return response.send("No profile picture!");
        }
        response.set('Content-Type','image/jpg');
        //For all previous responses, express automatically identified Json, not so for images.
        response.send(user.profile);
    }catch(e){
        response.status(400).send({error:e.toString()});
    }
})

module.exports=router;