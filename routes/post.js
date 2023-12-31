const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyToken = require('../verifyToken');

// Schema
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');

// GET recent and relevant posts
/**
 * IMPLEMENT ORDERING BY USERS THAT ARE BEING FOLLOWED
 */
router.get('/', 
    // Get all posts from database
    async(req, res, next) => {

        try{
            const posts = await Post
                .find({})
                .sort({ date: -1 })
                .populate([
                    { path: 'comments' },
                    { path: 'user_id', select: 'username picture _id', strictPopulate: false } 
                ])
                .exec();
            res.status(200).json(posts);

        } catch (err) {
            console.log(err)
            return next(err);
        }
    }
);

// POST create new post
router.post('/create', 
    verifyToken,
    // body('message').isLength(1).withMessage('Required field'),
    async(req, res, next) => {
        // const errors = validationResult(req);
        // Catch validation errors
        // if(!errors.isEmpty()) {
        //     res.status(500);
        // }

        try{
            const post = new Post({
                user_id: req.userId,
                message: req.body.message,
                image: req.body.base64String
            });

            await post.save();

            // Updated user doc
            await User.findOneAndUpdate(
                { _id: req.userId },
                {
                    $push: { posts: post }
                }
            )

            res.status(200).json(post);

        } catch (err) {
            res.status(500);
        }
    }
);

// POST like a post
router.post('/like/:id',
    verifyToken,
    async(req, res) => {
        try {
            const post_id = req.params.id;
            // const user = req.user;

            // Search DB
            const post = await Post.findOne({
                _id: post_id,
                'likes.users._id': req.userId
            });

            // Unlike post
            if(null !== post){

                // Decrease likes and pull user from like array
                const updated_post = await Post.findOneAndUpdate(
                    { _id: post_id},
                    {
                        $inc: { 'likes.count': -1 },
                        $pull: {'likes.users._id': userId }
                    },
                    { new: true }
                );
                res.status(200).json(updated_post.likes.count);

            // Like post
            } else {

                // Increase likes and push user to like array
                const updated_post = await Post.findOneAndUpdate(
                    { _id: post_id },
                    {
                        $inc: { 'likes.count': 1 },
                        $push: { 'likes.users._id': userId }
                    },
                    { new: true }
                );
                res.status(200).json(updated_post.likes.count);
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    }
);

// GET to see if user liked a post
router.get('/like/:id',
    verifyToken,
    async(req, res) => {
        try {
            const post_id = req.params.id;
            // const user = req.user;

            // Search DB
            const already_liked = await Post.findOne({
                _id: post_id,
                'likes.users._id': req.userId
            });

            if(null !== already_liked){
                res.status(200).json(true);
            } else {
                res.status(200).json(false);
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    }
);

// GET post by ID
router.get('/:id',
    async(req, res, next) => {
        console.log('GET POST ID CALELD!')
        try{
            const post_id = req.params.id;
            const post = await Post.findById(post_id);

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

// POST edit post
router.post('/:id/edit',
    body('message').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        try{
            const post_id = req.params.id;
            const old_post = await Post.findById(post_id);

            // Check if post exists
            if(null === old_post){
                return res.status(404).json('Post not found');
            }

            // Check is logged in user created original post
            if(req.userId == old_post.user_id){
                // Find post and update
                const updated_post = await Post.findOneAndUpdate(
                    { _id: post_id },
                    {
                        message: req.body.message,
                        edited: true
                    },
                    { new: true }
                );
                res.status(200).json(updated_post); 

            } else {
                res.status(403).json('Not the author of the post');
            }

        } catch (err) {
            return next(err);
        }
    }
);

// POST delete post
router.post('/:postId/delete',
    verifyToken,
    async(req, res, next) => {
        try{
            const postId = req.params.postId;
            const post = await Post.findById(postId);

            // Check if post exists
            if(null === post){
                return res.status(404).json('Post not found');
            }

            // Check is logged in user created original post

            if(req.userId.toString() == post.user_id.toString()){
                // Delete post
                await Post.deleteOne({ _id: post });
                res.status(200).json('Post deleted'); 

            } else {
                res.status(403).json('Not the author of the post');
            }

        } catch (err) {
            return next(err);
        }
}

);

// GET post's comments
router.get('/:id/comments',
    async(req, res, next) => {
        try{
            const post_id = req.params.id;
            const comments = await Comment.findById(post_id).populate('user_id');
            res.status(200).json(comments);

        } catch (err) {
            return next(err);
        }
    }
);

// POST add comment to a post
router.post('/:id/comments/create',
    verifyToken,
    body('message').isLength(1).withMessage('Required field').escape(),
    async(req, res, next) => {
        const errors = validationResult(req);
        // Catch validation errors
        if(!errors.isEmpty()) {
            res.status(500);
        }

        try{
            const post_id = req.params.id;
            const post = await Post.findById(post_id);

            // Create new comment
            const comment = new Comment({
                post_id: post_id,
                user_id: req.userId,
                message: req.body.message,
            });

            // Save comment
            await comment.save();

            // Add comment to post
            post.comments.push(comment);
            await post.save();

            res.status(200).json(comment);

        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;