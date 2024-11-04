const express = require('express');
const postRouter = express.Router();
const postController = require('../controllers/postController');
const isLoggedIn = require('../authentication/authentication');
const upload = require('../middlewares/multer');

postRouter.get('/', isLoggedIn, postController.getAllPosts);
postRouter.get('/:id', isLoggedIn, postController.getPostById);

postRouter.post('/', isLoggedIn, upload.uploadImagesFiles.single('posts'), postController.addPosts);
postRouter.post('/:id', isLoggedIn, postController.addCommentToPost);
postRouter.post('/:id/like/:userId', isLoggedIn, postController.likePost);
postRouter.post('/:id/unlike/:userId', isLoggedIn, postController.unlikePost);

postRouter.put('/:id', isLoggedIn, upload.uploadImagesFiles.single('posts'), postController.updatePost);

postRouter.delete('/:id', isLoggedIn, postController.deletePost);


module.exports = postRouter;