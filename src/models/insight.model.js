import mongoose , {Schema} from "mongoose";

const insightSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        insightType:{
            type:String,
            enum:['BudgetWarning', 'GoalMilestone', 'TripSummary', 'Anomaly', 'GeneralAdvice'],
            required:true
        },
        reference_id:{
            type:Schema.Types.ObjectId
        },
        summaryText:{
            type:String,
            required:true,
            trim:true
        },
        adviceText:{
            type:String,
            trim:true
        }
    },
    {timestamps:true}
);

export const Insight = mongoose.model("Insight", insightSchema);
