const mongoose=require('mongoose');
const validator=require('validator');
const taskSchema=new mongoose.Schema({
    description:{
        type:String,
        required:true,
        trim:true
    },
    completed:{
        type:Boolean,
        default:false,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps:true
});
const Tasks=mongoose.model("Tasks",taskSchema);

module.exports=Tasks;

/*const task1=new Tasks({
    description:"   Finish"
});
task1.save().then((result)=>{
    console.log(result);
}).catch((error)=>{
    console.log(error);
});*/