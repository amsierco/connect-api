const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// GET friend
router.get('/:id',
    async(req, res, next) => {
        try{
            const user_id = req.params.id;
            const user = await User.findById(user_id);
            if(null !== user){
                res.status(200).json({
                    username: user.username,
                    picture: user.picture,
                    _id: user._id
                }); 
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
    (req,res,next)=>{console.log('req recieved');next();},
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