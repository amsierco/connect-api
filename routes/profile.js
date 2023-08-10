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

// GET suggested users
router.get('/suggested-users',
    async(req, res, next) => {
        try {
            const activeUserId = req.query.activeUserId;

            // Get users not in activeUser friend list nor activeUser itself
            const unfilteredUsers = await User.find({
                'friends': {
                    $nin: activeUserId
                    
                },
                _id: {
                    $ne: activeUserId
                }
            })
            .populate(
                {
                    path: 'notifications',
                    populate: {
                        path: 'sender',
                        select: '_id'
                    }
                }
            )
            .select('_id username notifications picture');

            // Compute action button status
            const filteredUsers = unfilteredUsers.map(user => {
                let status = 'add';

                if(user.notifications.length !== 0){
                    // console.log(user.notifications[0]);
                    if(user.notifications[0].sender._id.toString() === activeUserId){
                        status = 'pending';
                    }
                }

                return { ...user._doc, status: status}
            })

            // console.log('Unfiltered')
            // console.log(unfilteredUsers);
            // console.log('Filtered')
            // console.log(filteredUsers);



            res.status(200).json(filteredUsers);

        } catch (err) {
            console.log(err);
            next(err);
        }
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

// GET profile friends
router.get('/:profileId/friends',
    async(req, res, next) => {
        try{
            const activeUserId = req.query.activeUserId;
            const profileId = req.params.profileId;
            
            const user = await User
            .findOne({
                _id: profileId,
            })
            .populate([
                {
                    path: 'notifications',
                    populate: {
                        path: 'sender',
                        select: '_id'
                    }
                },
                {
                    path: 'friends',
                    populate: {
                        path: 'notifications'
                    },
                    select: '_id username picture notifications'
                }
            ])
            .select('_id username picture notifications friends');

            const filteredFriends = user.friends.map(friend => {
                let status = 'remove';

                // Check notifications for activeUser as sender
                if(friend.notifications.length !== 0){
                    friend.notifications.map(notification => {
                        if(notification.sender._id.toString() === activeUserId){
                            status = 'pending';
                        }
                    })
                }

                // Check if friend is activeUser
                if(friend._id.toString() === activeUserId){
                    status = 'current';
                }

                return { ...friend._doc, status: status}
            })
    
            res.status(200).json(filteredFriends);

        } catch (err) {
            return next(err);
        }
    }
);

// POST edit profile description
router.post('/:profileId/edit',
    verifyToken,
    async(req, res, next) => {
        try{

            const profileId = req.user._id;
            const description = req.body.description;
            console.log('try update')
            await User.findOneAndUpdate(
                { _id: profileId },
                {
                    description: description
                }
            )
            
            console.log('update good');

            return res.status(200);
        } catch (err) {
            next(err);
        }
    }
)

module.exports = router;