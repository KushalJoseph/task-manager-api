const jwt=require('jsonwebtoken');
const User=require('../models/user');
const auth=async(request,response,next)=>{
    try{
        const token=request.header("Authorization").replace("Bearer ","");
        const decoded=jwt.verify(token,"thisismysecret");
        const user=await User.findOne({_id:decoded._id,"tokens.token":token});

        if(!user){
            throw new Error();
        }
        console.log(token);
        request.user=user;
        request.token=token;
        next();
    }catch(e){
        response.status(401).send("Something went wrong! Please authenticate");
    }
}

module.exports=auth;