import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error on app: ",error);
    })
    app.listen(process.env.PORT || 7000 ,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Error connecting to MongoDB:- \n",err);
    process.exit(1);
})