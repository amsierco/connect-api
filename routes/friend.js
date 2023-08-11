const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// GET friend
router.get('/:friendId',
    // verifyToken,
    // async(req, res, next) => {
    //     console.log('ROUTE CALLED!!!!')
    //     try{
    //         const user_id = req.params.friendId;
    //         // Gets friends by their id
    //         const user = await User.findById(user_id);

    //         if(null !== user){

    //             // Check if friend is current user
    //             if(user_id === req.user._id){
    //                 return res.status(200).json({
    //                     username: user.username,
    //                     picture: user.picture,
    //                     _id: user._id,
    //                     isFriend: true,
    //                     isUser: true,
    //                 }); 
    //             }

    //             // Check if logged in user is also a friend
    //             const activeUser = await User.findOne({
    //                 _id: user_id,
    //                 'friends': req.user
    //             })
    //             .populate(
    //                 {
    //                     path: 'notifications',
    //                     populate: {
    //                         path: 'sender',
    //                         select: '_id'
    //                     }
    //                 }
    //             )
    //             .select('notifications');

    //             if(null !== activeUser){

    //                 if(activeUser.notifications.length !== 0){
    //                     activeUser.notifications.map(notification => {
    //                         if(notification.sender._id.toString() === user_id){
    //                             return res.status(200).json({
    //                                 username: user.username,
    //                                 picture: user.picture,
    //                                 _id: user._id,
    //                                 isFriend: true,
    //                                 isUser: false,
    //                                 status: 'incoming'
    //                             }); 
    //                         }
    //                     })
    //                 } else {
    //                     return res.status(200).json({
    //                         username: user.username,
    //                         picture: user.picture,
    //                         _id: user._id,
    //                         isFriend: true,
    //                         isUser: false,
    //                         status: 'remove'
    //                     }); 
    //                 }

    //             } else {
    //                 res.status(200).json({
    //                     username: user.username,
    //                     picture: user.picture,
    //                     _id: user._id,
    //                     isFriend: false,
    //                     isUser: false,
    //                     status: 'add'
    //                 }); 
    //             }

    //         } else {
    //             res.status(404).json('User not found');
    //         }

    //     } catch (err) {
    //         return next(err);
    //     }
    // }
);

// POST send friend request
router.post('/:id/request',
    verifyToken,
    async(req, res, next) => {
        try {
            const reciever_id = req.params.id;
            const sender_id = req.user._id;

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
                res.status(200);

            } else {
                // Add friend
                await User.findOneAndUpdate(
                    {_id: reciever_id},
                    {
                        $push: { notifications: {notification_type: 'friend_request', sender: sender_id} }
                    },
                    {new: true}
                );

                res.status(200);
            }

        } catch (err) {
            next(err);
        }

    }
);


module.exports = router;