const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// GET friend
router.get('/:id',
    verifyToken,
    async(req, res, next) => {
        try{
            const user_id = req.params.id;
            // Gets friends by their id
            const user = await User.findById(user_id);

            if(null !== user){

                // Check if friend is current user
                if(user_id === req.user._id){
                    console.log('SAME USER')
                    return res.status(200).json({
                        username: user.username,
                        picture: user.picture,
                        _id: user._id,
                        isFriend: true,
                        isUser: true
                    }); 
                }

                // Check if logged in user is also a friend
                const friend_status = await User.findOne({
                    _id: user_id,
                    'friends': req.user
                });

                if(null !== friend_status){
                    console.log('ACTIVE USER IS FRIEND')
                    res.status(200).json({
                        username: user.username,
                        picture: user.picture,
                        _id: user._id,
                        isFriend: true,
                        isUser: false
                    }); 
                } else {
                    console.log('ACTIVE USER IS NOT FRIEND')
                    res.status(200).json({
                        username: user.username,
                        picture: user.picture,
                        _id: user._id,
                        isFriend: false,
                        isUser: false
                    }); 
                }

            } else {
                res.status(404).json('User not found');
            }

        } catch (err) {
            return next(err);
        }
    }
);

// POST send friend request
router.post('/:id/request',
    verifyToken,
    async(req, res, next) => {
        try {
            const reciever_id = req.params.id;
            const sender_id = req.user._id;

            /**
             * Add validation/checks
             * Force accepting now for testing
             */

            // Check if already friends
            const response =  await User.findOneAndUpdate(
                {
                    _id: reciever_id,
                    'friends': req.user
                },
                {
                    $pull: { friends: sender_id }
                },
                {new: true}
            );

            if(response) {
                // Remove friend
                console.log('remove friend')
                await User.findOneAndUpdate(
                    { _id: sender_id },
                    {
                        $pull: { friends: reciever_id }
                    }
                );
                return res.status(200);

            } else {
                // Add friend

                await User.findOneAndUpdate(
                    {_id: reciever_id},
                    {
                        $push: { notifications: {notification_type: 'friend_request', sender: sender_id} }
                    },
                    {new: true}
                );

                // await User.findOneAndUpdate(
                //     {_id: reciever_id},
                //     {
                //         $push: { friends: sender_id }
                //     },
                //     {new: true}
                // );

                // await User.findOneAndUpdate(
                //     {_id: sender_id},
                //     {
                //         $push: { friends: reciever_id }
                //     },
                //     {new: true}
                // );
                res.status(200);
            }

        } catch (err) {
            next(err);
        }

    }
);


module.exports = router;