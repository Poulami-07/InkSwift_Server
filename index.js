import 'dotenv/config' ;
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";

import docRoute from './routes/docRoute.js';//for pdf
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import signatureRoute from "./routes/signRoute.js";
import auditRoute from './routes/auditRoute.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = [
  "https://ink-swift-client-3xlrb8958-poulami-gandhis-projects.vercel.app",
  "https://ink-swift-client.vercel.app",
  "http://localhost:5173"  
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

  

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use('/api/docs', docRoute);
// app.use('/uploads', express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/signatures", signatureRoute);

// API Endpoints
app.get('/', (req, res) => {
  res.send("API Working 🚀");
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/audit', auditRoute);

app.listen(port, '0.0.0.0', () => console.log(`Server started on PORT: ${port}`));



