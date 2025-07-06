//store user data in db
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({    //structure of user data
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    verifyOtp: {type: String, default: ''},
    verifyOtpExpireAt: {type: Number, default: 0},
    isAccVerified: {type: Boolean, default: false},
    resetOtp: {type: String, default: ''},
    resetOtpExpireAt: {type: Number, default: 0},
    
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema) //create userModel again & again

export default userModel;