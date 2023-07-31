const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const user = require('../models/user');


// GET recent and relevant posts
/**
 * IMPLEMENT ORDERING BY DATE AND USERS THAT ARE BEING FOLLOWED
 */
router.get('/', 
    // Get all posts from database
    async(req, res, next) => {
        try{
            const posts = await Post.find({}).exec();
            res.status(200).json(posts);

        } catch (err) {
            return next(err);
        }
    }
);

// GET post by ID
router.get('/:id',
    verifyToken,
    async(req, res, next) => {
        try{
            const post_id = req.params.id;
            const post = await Post.findOne({ _id: post_id });
            console.log(post);
            if(null !== post){
                res.status(200).json(post); 
            } else {
                res.status(404).json('Post not found');
            }

        } catch (err) {
            return next(err);
        }
    }
);

// POST create new post
router.post('/create', 
    verifyToken,
    body('message').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        try{
            const post = new Post({
                user_id: req.user,
                message: req.body.message,
            });

            await post.save();
            res.status(200).json(post);

        } catch (err) {
            return next(err);
        }
    }
);

// POST edit post
router.post('/:id/edit',
    //verifyToken(),

);

// POST delete new post
router.post('/:id/delete',
    //verifyToken(),

);

// POST like a post
/**
 * TRY TO ADD UNLIKE FUNCTIONALITY TO SAME HTTP REQUEST
 */
router.post('/like',

);

/**
 * COMMENTS
 */

module.exports = router;