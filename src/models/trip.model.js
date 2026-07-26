import mongoose , {Schema} from "mongoose";

const tripSchema = new Schema(
    {
        admin:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        tripName:{
            type:String,
            required:true,
            trim:true
        },
        location:{
            type:String,
            trim:true
        },
        tripBudget:{
            type:Number,
            required:true
        },
        startDate:{
            type:Date,
            trim:true
        },
        endDate:{
            type:Date,
            trim:true
        },
        status:{
            type:String,
            enum:['planned', 'ongoing', 'completed', 'cancelled'],
            default:'planned'
        },
        coverImage:{
            type:String,
            trim:true
        },
        members:[
            {
                type:Schema.Types.ObjectId,
                ref:"User"
            }
        ]
    },
    {timestamps:true}
);

export const Trip = mongoose.model("Trip", tripSchema);
