const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require('jsonwebtoken');
const app=express();
const mongoose=require('./src/db/mongoose');//Just to connect to the database
const multer=require('multer');
const auth=require('./src/middleware/auth');
const User=require('./src/models/user');
const Tasks=require('./src/models/task');
const port=process.env.PORT||3000;

const userRouter=require('./src/routers/userRouter');
const taskRouter=require('./src/routers/taskRouter');
app.use(express.json()); //So that request.body doesnt come as undefined, it comes as a JSON.
//const port=process.env.port||3000;

app.use(userRouter);
app.use(taskRouter);


app.listen(port,()=>{
    console.log("Server up and running");
});



 
/*const obj={
    name:"Object1",
    age:19
}
obj.toJSON=function(){
    return {};
}
//Used by the JSON.stringify method to enable the transformation of an object's data for JavaScript Object Notation (JSON) serialization. JSON.stringify is called whenever we send data across, so we can manipulate it in this function, and it works for all cases.
console.log(JSON.stringify(obj));*/

//C:\Users\hp\Desktop\Coding and Stuff\mongodb-data