// middleware/ipLogger.js
const logIp = (req, res, next) => {
  req.ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  next();
};
export default logIp;
