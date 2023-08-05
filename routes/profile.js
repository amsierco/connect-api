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
            const user = await User.findById(user_id);
            delete user.password;
            // console.log(user);
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

// GET friends
router.get('/:id/friends',
    async(req, res, next) => {
        try{
            const user_id = req.params.id;
            const user = await User.findById(user_id);
            const friends = user.friends;

            if(null !== user){
                res.status(200).json(friends); 
            } else {
                res.status(404).json('User not found');
            }

        } catch (err) {
            return next(err);
        }
    }
);


module.exports = router;