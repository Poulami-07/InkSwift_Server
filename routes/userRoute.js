import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/userController.js';

const userRouter = express.Router(); // Create router using express router

userRouter.get('/data', userAuth, getUserData);

export default userRouter; // Exporting the router
// This router handles user-related requests, such as fetching user data.
// The userAuth middleware ensures that the user is authenticated before accessing the user data endpoint.