const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("./db/config")
dotenv.config();
const app = express();
app.use(express.json());
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    if (!email && !password) {
      return res.status(400).json({
        "error": "Email is required"
      })
    }
    if (!email || !password) {
      return res.status(400).json({
        "error": "Email and password are required"
      })
    }
  }
  const existingUser = await prisma.users.findUnique({ where: { email: email } })
  if (existingUser) {
    return res.status(400).json({
      "error": "Email already in use"
    })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log(hashedPassword)
  const newUser = await prisma.users.create({
    data: {
      name, email, password:hashedPassword
    }
  })
  return res.status(200).json({
    "message": "User created successfully",
    "userId": 1
  })
})
app.post('/api/auth/login' , async (req , res)=>{
  const {email , password} = req.body;
  try{
  if(!email || !password){
    {return res.status(400).json({
      "error": "Email and password is required" 
    })};
  };
  const alreadyExists = await prisma.users.findUnique({
    where : {email : email}
  });

  if(!alreadyExists){
    // console.log(alreadyExists)
    return res.status(404).json({
      "error": "User not found"
    });
  };

    const isPasswordCorrect = await bcrypt.compare(password , alreadyExists.password);
    if(!isPasswordCorrect){
      return res.status(401).json({
        "error": "Invalid credentials"
      });
    };
    const token = jwt.sign({userId : alreadyExists.id , email : alreadyExists.email} , "68d97a7b7965450091cd86a139a66caaca857c05511860b11b0064e388ba105328de791c8336dd7561f52ea7f2fa64f2d09810cfea12978b571cdceab05270b" , {expiresIn : '1h'} );
    return res.status(200).json({
      "userdata": {
        "id": alreadyExists.id,
        "name": alreadyExists.name,
        "email": alreadyExists.email
      },
      "accesstoken": token
    });
  } catch(err){
    console.log(err);
    return res.status(500).json({"message" : "Intenal server error"});
  }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});

module.exports = app;