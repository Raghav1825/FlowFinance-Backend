import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true
        },
        password:{
            type:String,
            trim:true
        },
        authProvider:{
            type:String,
            enum:['email','google'],
            default:'email'
        },
        googleId:{
            type:String,
            trim:true
        },
        notification:{
            budgetAlerts: { 
                type: Boolean, 
                default: true 
            },
            weeklySummary: { 
                type: Boolean, 
                default: true 
            },
            goalMilestones: { 
                type: Boolean, 
                default: true 
            }
        },
        refreshToken:{
            type:String
        }
    },
    {timestamps:true}
)

export const User = mongoose.model("User",userSchema)