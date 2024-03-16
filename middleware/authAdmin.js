const jwt = require("jsonwebtoken");
require("dotenv").config();
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
    throw err;
  }

  if (!decoded) {
    const error = new Error("Not authenticationed.");

    throw error;
  }
  if (decoded.role !== "admin") {
    return res.status(402).json({ msg: "Not authoziration" });
  }
  req.userId = decoded.userId;
  next();
};
