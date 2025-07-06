//to create ner user and using this controller function(register,login, verify ac, pw reset etc) we will create the API end point

//For user Registration
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; //generate token for authentication
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplate.js';


export const register = async (req, res) =>{

    const {name,email,password} = req.body;


    if(!name || !email || !password){ //if these are available
        return res.json({success: false, message: 'Missing Details'})
    }
    try{    //try to create ac & store the user data in db
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.json({success: false, message: 'Email (user) already exists'}); 
        }
        
        const hashedPassword = await bcrypt.hash(password,10); //encrypt the pw use bcrypt package

        const user = new userModel({name, email, password: hashedPassword});
        await user.save(); //save the user data in db


        //generate token for authentication & send it using cookies
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'}); //token generated using jwt

        res.cookie('token', token, { //send the token to user in response,using the cookie to send response 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });  

        //sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to InkSwift',
            text: `Welcome to InkSwift. Your account has been created with email id : ${email}`,
        };
        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: 'User created successfully'});
                

    }catch(error){
        res.json({success: false, message: error.message});
    }
}


// controller function for user login
export const login = async (req, res) =>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'Email and password are required'})
    }
    try{
        const user = await userModel.findOne({email});
        
        if(!user){
            return res.json({success: false, message: 'Invalid email'})
        }

        const isMatch = await bcrypt.compare(password, user.password); //pw from req body & db is same or not
        if(!isMatch){
            return res.json({success: false, message: 'Invalid password'})
        }

        //generate token for authentication & send it using cookies
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'}); //token generated using jwt

        res.cookie('token', token, { //send the token to user in response,using the cookie to send response 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });  

        

        return res.json({success: true, message: 'User logged in successfully'});



    }catch(error){
        res.json({success: false, message: error.message});
    }
}

// controller function for user logout

export const logout = async (req,res) =>{
    try{
        res.clearCookie('token',{
        httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });

        return res.json({success: true, message: 'User logged out successfully'});
        
    }catch(error){
        res.json({success: false, message: error.message })
    }
}

//Send Verification code to user email
export const sendVerifyOtp = async (req, res)=> {
    try{
        const userId = req.userId;
        //---------------
         if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

        const user = await userModel.findById(userId);

        if(user.isAccVerified){
            return res.json({success: false, message: 'Account already verified'});
        }
        
        const otp = String (Math.floor(100000 + Math.random() * 900000)); // Generate a 6-digit OTP
        // Save OTP and its expiration time in the user document
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // OTP valid for 1 day
        await user.save();

        // Send OTP to user's email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            //text: `Your OTP is ${otp}. Verify your account using this OTP.`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}",user.email)
        };

        await transporter.sendMail(mailOptions);

        res.json({success: true, message: 'Verification OTP sent to your email'});


    }catch(error){
        res.json({success: false, message: error.message });
    }
}

// Verify the user's email using OTP in website
// This will be used to verify the user account after registration
export const verifyEmail = async (req, res) => {
    
    const userId = req.userId;
    const { otp } = req.body;
   

    if(!userId || !otp){
        return res.json({success: false, message: 'Missing details'}); 
    }

    try{
        const user = await userModel.findById(userId); 
        
        if(!user){
            return res.json({success: false, message: 'User not found'});
        }
        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'}); // Check if the OTP is empty or does not match
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP expired'}); // Check if the OTP has expired
        }

        user.isAccVerified = true; // Set account as verified
        user.verifyOtp = ''; // Clear the OTP after verification
        user.verifyOtpExpireAt = 0; // Clear the expiration time
        await user.save(); // Save the updated user document

        res.json({success: true, message: 'Account verified successfully'});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}

//Creating  a API to check if the user is logged in or not (authentication check)
export const isAuthenticated = async (req, res) => {
    try{
        return res.json({success: true}); //return the user data if authenticated

    }catch(error){
        res.json({success: false, message: error.message});
    }
}


// reset the password using OTP
export const sendResetOtp = async (req, res) =>{
    const {email} = req.body;

    if(!email){
        return res.json({success: false, message: 'Email is required'});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        const otp = String (Math.floor(100000 + Math.random() * 900000)); 
        // Save OTP and its expiration time in the user document
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; 
        await user.save();

        // Send OTP to user's email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            //text: `Your OTP for password reset is ${otp}. It is valid for 15 minutes.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: 'Password reset OTP sent to your email'});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}


// Verify the OTP for password reset
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({success: false, message: 'Email, OTP, and new password are required'});
    }

    try{
        const user = await userModel.findOne({email}); 
        
        if(!user){
            return res.json({success: false, message: 'User not found'});
        }
        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'}); // Check if the OTP is empty or does not match
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP expired'}); // Check if the OTP has expired
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
        user.password = hashedPassword; // Update the user's password
        user.resetOtp = ''; // Clear the OTP after verification
        user.resetOtpExpireAt = 0; // Clear the expiration time
        await user.save(); // Save the updated user document

        res.json({success: true, message: 'Password reset successfully'});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}