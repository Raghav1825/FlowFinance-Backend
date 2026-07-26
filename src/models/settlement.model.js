import mongoose , {Schema} from "mongoose";

const settlementSchema = new Schema(
    {
        trip_id:{
            type:Schema.Types.ObjectId,
            ref:"Trip",
            required:true
        },
        paidBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        paidTo:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            enum:['PENDING', 'COMPLETED'],
            default:'COMPLETED'
        }
    },
    {timestamps:true}
);

export const Settlement = mongoose.model("Settlement", settlementSchema);
