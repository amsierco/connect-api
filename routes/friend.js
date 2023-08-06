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
                    picture: user.picture
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

            await User.findOneAndUpdate(
                {_id: reciever_id},
                {
                    $push: { friends: sender_id }
                },
                {new: true}
            );

            await User.findOneAndUpdate(
                {_id: sender_id},
                {
                    $push: { friends: reciever_id }
                },
                {new: true}
            );

            console.log('friends added')
            res.status(200);

        } catch (err) {
            next(err);
        }

    }
);


module.exports = router;