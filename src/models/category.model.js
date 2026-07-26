import mongoose , {Schema} from "mongoose";

const categorySchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        categoryName:{
            type:String,
            required:true,
            trim:true
        },
        type:{
            type:String,
            enum:['income', 'expense'],
            required:true
        },
        icon:{
            type:String,
            trim:true
        },
        color:{
            type:String,
            trim:true
        }
    },
    {timestamps:true}
);

export const Category = mongoose.model("Category", categorySchema);
