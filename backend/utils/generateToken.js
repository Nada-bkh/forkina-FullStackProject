const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiration } = require("../config/authConfig");

const generateToken = (user) => {
    return jwt.sign(
        { id: user.idUser, role: user.role },
        jwtSecret,
        { expiresIn: jwtExpiration }
    );
};

module.exports = generateToken;
