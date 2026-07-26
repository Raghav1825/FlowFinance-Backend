import mongoose , {Schema} from "mongoose";

const otpSchema = new Schema(
    {
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        otp:{
            type:String,
            required:true
        },
        expire_time:{
            type:Date,
            required:true
        }
    },
    {timestamps:true}
);

export const OTP = mongoose.model("OTP", otpSchema);
