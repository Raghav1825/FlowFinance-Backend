import mongoose , {Schema} from "mongoose";

const transactionSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        type:{
            type:String,
            enum:['income', 'expense', 'transfer'],
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        category_id:{
            type:Schema.Types.ObjectId,
            ref:"Category",
            required:true
        },
        description:{
            type:String,
            trim:true
        },
        notes:{
            type:String,
            trim:true
        },
        goal_id:{
            type:Schema.Types.ObjectId,
            ref:"Goal"
        },
        trip_id:{
            type:Schema.Types.ObjectId,
            ref:"Trip"
        },
        paidBy:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        splitType:{
            type:String,
            enum:['EQUAL', 'EXACT', 'PERCENTAGE']
        },
        splits:[
            {
                user_id:{
                    type:Schema.Types.ObjectId,
                    ref:"User",
                    required:true
                },
                amountOwed:{
                    type:Number,
                    required:true
                }
            }
        ]
    },
    {timestamps:true}
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
