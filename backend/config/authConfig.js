require("dotenv").config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzQwMTM1NjEyLCJleHAiOjE3NDA3NDA0MTJ9.zUhKAi8PO7X8IAfPcbGw2j2LhdtuLBW6ww2E0VuthXU",
    jwtExpiration: "7d", // Token expires in 7 days
};
