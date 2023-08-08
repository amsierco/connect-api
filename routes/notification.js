const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');

// GET notifications
router.get('/:id', 
    // Get user from token
    verifyToken,
    // Extract notifications
    async(req, res, next) => {
        // const notifications = req.user.notifications;
        try {
            const response = await User.findById(req.params.id).populate('notifications.sender');

            console.log(response);
            res.status(200).json(response.notifications);
        } catch (err) {
            next(err);
        }
    }
);

// POST notifications response action
router.post('/friend-request/:id/:status', 
    // Get user from token
    verifyToken,
    // Extract notifications
    async(req, res, next) => {
        try {
            const response = await User.findOne(
                { 
                    _id: req.user, 
                    notifications: {
                        $elemMatch: {
                            _id: req.params.id,
                        },
                    },
                },
            ).select('notifications');

            // console.log(notification);

            if(response){
                const notification = response.notifications[0];
                const current_user = req.user;
                const notif_user = notification.sender;
                // Accept friend request
                if(req.params.status === 'accept'){

                    // Update active user
                    await User.findOneAndUpdate(
                        {_id: current_user},
                        {
                            $push: { friends: notif_user },
                            $pull: { 
                                notifications: {
                                    _id: req.params.id,
                                    
                                },
                            }
                        },
                        {new: true}
                    );

                    // Update user who initiated notification request
                    await User.findOneAndUpdate(
                        {_id: notif_user},
                        {
                            $push: { friends: current_user }
                        }
                    );

                    console.log('FRIEND ADDED')
                    res.status(200);

                } else if (req.params.status === 'reject') {
                    // Update active user
                    await User.findOneAndUpdate(
                        {_id: current_user},
                        {
                            $pull: { 
                                notifications: {
                                    _id: req.params.id,
                                    
                                },
                            }
                        }
                    );

                    console.log('FRIENDS NOT ADDED')
                    res.status(200);
                }

            } else {
                console.log('NOTIFICATION NOT FOUND')
                res.status(500);
            }

        } catch (err) {
            console.log(err)
            next(err);
        }
        

    }
);


module.exports = router;