// // a middleware that will get the cookie and from that cookie it will find the token ,from that token it will find the user id, that user id will be added in the request body

 import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) =>{ //if hit the api endpoint this middleware func will execute
    const {token} = req.cookies;

    if(!token){
        return res.json({success: false, message: "Unauthorized, Login Again"}); //if token not found in cookies then return unauthorized
    }
    try{
        const tokenDecode = jwt.verify(token,process.env.JWT_SECRET) //decode & verify the token


        if(tokenDecode.id){
            req.userId = tokenDecode.id;
        }else{
            return res.json({success: false, message: "Not authorized. Login Again"});
        }

        next(); //call the controller func

    }catch(error){
        
        return res.json({success: false, message: "Not authorized"});
    }
}

 export default userAuth;
