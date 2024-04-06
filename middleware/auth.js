require("dotenv").config();
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!authHeader) {
    return res.status(401).json({ msg: "Not authenticationed" });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SIGNATURE);
  } catch (err) {
    res.status(401).json({ msg: "Not authenticationed" });
    throw err;
  }

  if (!decoded) {
    const error = new Error("Not authenticationed.");

    throw error;
  }
  req.userId = decoded.userId;
  next();
};
