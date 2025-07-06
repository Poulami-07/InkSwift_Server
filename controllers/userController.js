//Return user information : if user is verified or not
import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      userData: {
        name: user.name,
        isAccVerified: user.isAccVerified,
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
