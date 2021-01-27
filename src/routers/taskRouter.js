const express=require('express');
const router=new express.Router();
const auth=require('../middleware/auth');
const Tasks=require('../models/task');

router.post('/tasks',auth, async(request,response)=>{
    //const newTask=new Tasks(request.body);
    const newTask=new Tasks({
        ...request.body,//ES6 "Spread operator"
        createdBy:request.user.id
    });
    try{
        await newTask.save();
        return response.status(201).send(newTask);
    }catch(e){
        console.log(e);
        return response.send(500).send(e);
    }
});
router.get('/tasks',auth,async(request,response)=>{
    const completed=request.query.completed;
    try{
        let tasks;
        if(!completed){
            tasks=await Tasks.find({createdBy:request.user._id});
        }else if(completed=="true"||completed=="false"){
            tasks=await Tasks.find({createdBy:request.user._id,completed});
        }
        return response.status(201).send(tasks);
    }catch(e){
        console.log(e);
        return response.send(500).send(e);
    }
});
router.get('/tasks/:id',auth,async(request,response)=>{
    const id=request.params.id;
    try{
        const task=await Tasks.findOne({id,createdBy:request.user._id});
        return response.status(201).send(task);
    }catch(e){
        return response.send(500).send(e);
    }
});

router.patch('/tasks/:id',auth,async(request,response)=>{
    const updates=Object.keys(request.body);
    const allowedUpdates=["description","completed"];
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
        const task=await Tasks.findOne({_id:request.params.id,createdBy:request.user._id});
        updates.forEach((update)=>{
            task[update]=request.body[update];
        });
        await task.save();
        return response.status(201).send(task);
    }catch(e){
        return response.sendStatus(500,{error:"Something went wrong!"});
    }
});

router.delete('/tasks/:id',async(request,response)=>{
    try{
        const task=await Tasks.findOneAndDelete({_id:request.params.id,createdBy:request.user._id});
        if(task==null){
            return response.status(404).send({"message":"Task not found"});
        }else{
            return response.status(201).send(task);
        }
    }catch(e){
        return response.status(500).send({"error":"something went wrong!"});
    }
});
module.exports=router;

