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
        console.log('defuilt profie')
        const user = req.user;
        res.status(200).json(user);
    }
);

// GET profile data from ID
router.get('/:profileId', 
    async(req, res, next) => {
        try{
            const profileId = req.params.profileId;
            const activeUserId = req.query.activeUserId;
            // Search for user and populate friend array if it contains activeUserId
            const user = await User
                .findById(profileId)
                .populate([
                    {
                        path: 'friends', 
                        match: {'_id': activeUserId}
                    },
                    {
                        path: 'posts',
                        limit: 9
                    }
                ]);

            if(user){
                const reply = {
                    user,
                    isOwner: false,
                    isFriend: false,
                };

                // Check if requested profile = active user profile
                if(profileId === activeUserId){
                    reply.isOwner = true;
                }

                // Check if requested user is friends with active user
                if(user.friends.length !== 0){
                    reply.isFriend = true;
                }

                res.status(200).json(reply);
                
            } else {
                res.status(404);
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