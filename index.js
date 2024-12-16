const express = require('express');
const dotenv = require('dotenv'); 
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
dotenv.config(); 
const {PrismaClient} = require("@prisma/client")

const prisma = new PrismaClient()

const app = express();
app.use(express.json()); 

app.post("/api/auth/signup", async(req, res)=>{
  const {name, email, password} = req.body;
  if(!email){
    return res.status(400).json({
      "error": "Email is required"
    })
  }
  if(!password){
    return res.status(400).json({
      "error": "Password is required"
    })
  }
  const exist = await prisma.user.findUnique({where: {email:email}})
  if(exist){
    return res.status(400).json({
      "error": "Email already in use"
    })
  }
  const hashed = await bcrypt.hash(password, 10)
  const create= await prisma.user.create({data:{
    name, email, password:hashed
  }})
  return res.status(201).json({
    "message": "User created successfully",
    "userId": create.id
  })
})

app.post("/api/auth/login", async(req, res)=>{
  const {email, password} = req.body; 
  if(!email||!password){
    return res.status(400).json({
      "error": "Email and password are required"
    })
  }
  const exist = await prisma.user.findUnique({where: {email:email}})
  if(!exist){
    return res.status(404).json({
      "error": "User not found"
    })
  }
  const isvalid = await bcrypt.compare(password, exist.password)
  if(!isvalid){
    return res.status(401).json({
      "error": "Invalid credentials"
    })
  }
  const token = jwt.sign({userId: exist.id, name: exist.name, email: exist.email, password: exist.password}, "68d97a7b7965450091cd86a139a66caaca857c05511860b11b0064e388ba105328de791c8336dd7561f52ea7f2fa64f2d09810cfea12978b571cdceab05270b")
  return res.status(200).json({
    "userdata": exist,
    "accesstoken": token
  })
})









const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});

module.exports=  app;