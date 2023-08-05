const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// GET profile of current user
router.get('/', 
    // Get user from token
    verifyToken,
    async(req, res, next) => {
        const user = req.user;
        res.status(200).json(user);
    }
);

// GET profile from ID
router.get('/:id', 
async(req, res, next) => {
    try{
        const user_id = req.params.id;
        const user = await User.findById(user_id).projection({ password: 0 });
        if(null !== user){
            res.status(200).json(user); 
        } else {
            res.status(404).json('User not found');
        }

    } catch (err) {
        return next(err);
    }
}
);

module.exports = router;