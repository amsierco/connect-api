const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// // GET profile of current user
// router.get('/', 
//     // Get user from token
//     verifyToken,
//     async(req, res, next) => {
//         console.log('defuilt profie')
//         const user = req.user;
//         res.status(200).json(user);
//     }
// );

// GET suggested users
router.get('/suggested-users',
    async(req, res) => {
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

            const activeUser = await User.findById(activeUserId)
            .populate(
                {
                    path: 'notifications',
                    populate: {
                        path: 'sender',
                        select: '_id'
                    }
                }
            )
            .select('notifications');

            // Compute action button status
            const filteredUsers = unfilteredUsers.map(user => {
                // console.log(user);
                let status = 'add';

                if(user.notifications.length !== 0){
                    if(user.notifications[0].sender._id.toString() === activeUserId){
                        status = 'pending';
                    }
                }

                // Check if user sent request to activeUser
                if(status === 'add'){
                    if(activeUser.notifications.length !== 0){
                        activeUser.notifications.map(notification => {
                            if(notification.sender._id.toString() === user._id.toString()){
                                status = 'incoming';
                            }
                        })
                    }
                }

                return { ...user._doc, status: status}
            })

            res.status(200).json(filteredUsers);

        } catch (err) {
            res.status(500).json(err);
        }
    }
);

// GET user profile
router.get('/:profileId', 
    async(req, res) => {
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
                        path: 'notifications',
                        match: {'sender._id': activeUserId}
                    },
                    {
                        path: 'posts',
                        select: '_id message likes comments image',
                        limit: 9
                    }
                ])
                .select('-password -email')
                // Convert to JS obj
                .lean();

            const activeUser = await User.findById(activeUserId)
            .populate(
                {
                    path: 'notifications',
                    populate: {
                        path: 'sender',
                        select: '_id'
                    }
                }
            )
            .select('notifications');

            if(user){
                user.isOwner = false;
                user.status = 'add';
                

                // Check if requested profile is activeUser
                if(profileId === activeUserId){
                    user.isOwner = true;
                    user.status = 'current';
                }

                // Check if requested user is friends with active user
                if(user.friends.length !== 0){
                    user.status = 'remove';
                }

                // Check for pending status
                if(user.notifications.length !== 0){
                    user.notifications.map(notification => {
                        if(notification.sender.toString() === activeUserId){
                            user.status = 'pending';
                        }
                    })  
                }

                // Check for incoming status
                // Check if user sent request to activeUser 
                if(activeUser.notifications.length !== 0){
                    activeUser.notifications.map(notification => {
                        if(notification.sender._id.toString() === user._id.toString()){
                            user.status = 'incoming';
                        }
                    })
                }

                res.status(200).json(user);
                
            } else {
                res.status(404).json('User not found');
            }

        } catch (err) {
            res.status(500).json(err);
        }
    }
);

// GET profile friends
router.get('/:profileId/friends',
    async(req, res) => {
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

            const activeUser = await User.findById(activeUserId)
            .populate(
                {
                    path: 'notifications',
                    populate: {
                        path: 'sender',
                        select: '_id'
                    }
                }
            )
            .select('notifications');

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

                // Check if user sent request to activeUser 
                if(activeUser.notifications.length !== 0){
                    activeUser.notifications.map(notification => {
                        if(notification.sender._id.toString() === friend._id.toString()){
                            status = 'incoming';
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
            res.status(500).json(err);
        }
    }
);

// POST edit profile description
router.post('/:profileId/edit',
    verifyToken,
    async(req, res) => {
        try{
            const profileId = req.user._id;
            const description = req.body.description;
            const picture = req.body.base64String;

            if(picture){

                await User.findOneAndUpdate(
                    { _id: profileId },
                    {
                        description: description,
                        picture: picture
                    }
                )
            } else {
                await User.findOneAndUpdate(
                    { _id: profileId },
                    {
                        description: description
                    }
                )
            }

            res.status(200);

        } catch (err) {
            res.status(500).json(err);
        }
    }
)

module.exports = router;