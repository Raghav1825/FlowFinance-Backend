import mongoose , {Schema} from "mongoose";

const goalSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        goalName:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            trim:true
        },
        targetAmount:{
            type:Number,
            required:true
        },
        currentTotal:{
            type:Number,
            default:0
        },
        targetDate:{
            type:Date
        },
        icon:{
            type:String,
            trim:true
        },
        status:{
            type:String,
            enum:['in_progress', 'completed', 'cancelled'],
            default:'in_progress'
        }
    },
    {timestamps:true}
);

export const Goal = mongoose.model("Goal", goalSchema);