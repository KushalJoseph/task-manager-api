const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const Tasks=require('../models/task');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true, //Making email unique and different
        required:true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Please provide a valid error!");
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:7,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Cannot contain \"password\""); 
            }
        }
    },
    age:{
        type:Number,
        default:18,
        validate(value){
            if(value<18){
                throw new Error("You must be older than 18!");
            }
        }
    },
    tokens:[{
            token:{
                type:String,
                required:true
            }
    }],
    profile:{
        type:Buffer
    }
},{
    timestamps:true
});
//Instance method
userSchema.methods.generateAuthToken=async function(){
    const user=this;
    const token=jwt.sign({_id:user._id.toString()},"thisismysecret");
    user.tokens=user.tokens.concat({token});
    await user.save();
    //The above is not directly converted to and fro.
    return token;
}

userSchema.methods.toJSON=function(){
    const user=this;
    const userObject=user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.profile;//Because it is so big.
    return userObject;
}

//Static method
userSchema.statics.findByCredentials=async(email,password)=>{
    const user=await User.findOne({email});//Shorthand syntax used.
    //findOne, findOneAndUpdate etc methods are used on a particular CLASS.
    if(!user){
        throw new Error("User doesnt exist!");
    }
    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch){
        throw new Error("Wrong password");
    }else{
        return user;
    }
}

//Middleware-Running some code after "saving"
userSchema.pre('save',async function(next){
    const user=this; //This is the user being saved currently
    if(user.isModified("password")){//Works for both updating and creating
        user.password=await bcrypt.hash(user.password,8);
    }
    next();
});

//Can also use middleware to delete all tasks of a deleted user.
/*userSchema.pre('remove',async function(next){
    const user=this;
    await Tasks.deleteMany({createdBy:user._id});
    next();
});*/

const User=mongoose.model("User",userSchema);

module.exports=User;
