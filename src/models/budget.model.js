import mongoose , {Schema} from "mongoose";

const budgetSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        category_id:{
            type:Schema.Types.ObjectId,
            ref:"Category",
            required:true
        },
        amountLimit:{
            type:Number,
            required:true
        },
        period:{
            type:String,
            enum:['monthly', 'weekly', 'yearly'],
            default:'monthly'
        }
    },
    {timestamps:true}
);

export const Budget = mongoose.model("Budget", budgetSchema);
