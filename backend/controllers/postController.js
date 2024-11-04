const { writeFile, readFile } = require('../models/info');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
const postsFilePath = path.join(__dirname, '..', 'data', 'posts.json');
const commentsFilePath = path.join(__dirname, '..', 'data', 'postComments.json');

const addPosts = (req, res) => {
    const { title, content, userId } = req.body;

    if (!title || !content || !userId) {
        return res.status(400).send("Bad request...");
    }

    if (!req.file) {
        return res.status(404).send("No file were uploaded. ");
    }

    const users = readFile(usersFilePath);
    const posts = readFile(postsFilePath);

    let user = null;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            user = users[i];
            break;
        }
    }

    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }

    const post = {
        id: uuidv4(),
        title,
        content,
        image: req.file.filename,
        likes: 0,
        userId,
        timeStamp: new Date().toLocaleString()
    };

    posts.push(post);
    writeFile(postsFilePath, posts);

    return res.status(201).json(post);
};

const getAllPosts = (req, res) => {
    try {
        const posts = readFile(postsFilePath);
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch posts' });
    }
}

// Function to add a comment to a post
const addCommentToPost = (req, res) => {
    const {content} = req.body;
    const posts = readFile(postsFilePath);
    let post = null;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].id == req.params.id) {
            post = posts[i];
            break;
        }
    }

    if (!post) {
        return res.status(400).json({ msg: "Post not found" });
    }

    const comment = {
        id: uuidv4(),
        content: content,
        likes: 0,
        postId: req.params.id,
        timestamp: new Date().toLocaleString()
    };
    const comments = readFile(commentsFilePath);
    comments.push(comment);
    writeFile(commentsFilePath, comments);
    
    return res.status(201).json(comment);
};

const getCommentsByPost = (req, res) => {
    const {postId} = req.body;
    const comments = readFile(commentsFilePath);
    const commentsByPost = [];

    for (let i = 0; i < comments.length; i++) {
        if (comments[i].postId == postId) {
            commentsByPost.push(comments[i]);
        }
    }
    if (commentsByPost.length > 0) {
        return res.status(200).json(commentsByPost);
    }
    return res.status(404).send("No comments to Post")
}

const getPostById = (req, res) => {
    try {
        const posts = readFile(postsFilePath);
        for (let i = 0; i < posts.length; i++) {
            if (posts[i].id == req.params.id) {
                const postComments = getCommentsByPost(posts[i].id);
                // Combine post with its comments
                const postWithComments = {
                    ...posts[i],
                    comments: postComments
                };
                res.status(200).json(postWithComments);
            }
        }
    } catch (error) {
        res.status(404).send("No post found...");
    }
};


const updatePost = (req, res) => {
    const { id } = req.params;
    const { title, content, userId } = req.body;

    try {
        const posts = readFile(postsFilePath);

        for (let index = 0; index < posts.length; index++) {
            if (posts[index].id === id) {

                if (posts[index].userId === userId) {
                    const updatedPost = {
                        ...posts[index],
                        title: title || posts[index].title,
                        content: content || posts[index].content,
                        image: req.file ? req.file.filename : posts[index].image,
                        timeStamp: new Date().toLocaleString() // Update timestamp to current time
                    };
                    
                    posts[index] = updatedPost;
                    writeFile(postsFilePath, posts);

                    res.status(200).json(updatedPost);
                    return;
                } else {
                    return res.status(403).send("You are not authorized to update this post");
                }
            }
        }
        return res.status(404).send("Post not found");
    } catch (err) {
        return res.status(500).send("An error occurred: " + err.message);
    }
};


const deletePost = (req, res) => {
    const { id, role, userId } = req.body;
    try {
        const posts = readFile(postsFilePath);

        for (let index = 0; index < posts.length; index++) {
            if (posts[index].id === id) {
                if (posts[index].userId === userId || role === 'admin') {
                    posts.splice(index, 1); // Corrected slice to splice for deletion
                    res.status(200).send("Post Deleted");
                    return;
                } else {
                    return res.status(403).send("You are not authorized to delete this post");
                }
            }
        }
        return res.status(404).send("Post not found");
    } catch (err) {
        return res.status(500).send("An error occurred: " + err.message);
    }
}

const likePost = (req, res) => {
    const { id, userId } = req.params;
    try {
        const posts = readFile(postsFilePath);

        for (let index = 0; index < posts.length; index++) {
            if (posts[index].id === id) {
                const post = posts[index];

                if (post.likedBy && post.likedBy.includes(userId)) {
                    return res.status(400).send("You have already liked this post");
                }

                post.likedBy = post.likedBy || [];
                post.likedBy.push(userId);
                post.likes = (post.likes || 0) + 1;

                writeFile(postsFilePath, posts);
                return res.status(200).json({ message: "Post liked", post });
            }
        }
        return res.status(404).send("Post not found");
    } catch (err) {
        return res.status(500).send("An error occurred: " + err.message);
    }
};

const unlikePost = (req, res) => {
    const { id, userId } = req.params;
    const { } = req.user; 

    try {
        const posts = readFile(postsFilePath);

        for (let index = 0; index < posts.length; index++) {
            if (posts[index].id === id) {
                const post = posts[index];

                if (!post.likedBy || !post.likedBy.includes(userId)) {
                    return res.status(400).send("You have not liked this post");
                }

                post.likedBy = post.likedBy.filter(uid => uid !== userId);
                post.likes = Math.max((post.likes || 1) - 1, 0); // Ensure likes don't go negative

                writeFile(postsFilePath, posts);
                return res.status(200).json({ message: "Post unliked", post });
            }
        }
        return res.status(404).send("Post not found");
    } catch (err) {
        return res.status(500).send("An error occurred: " + err.message);
    }
};


module.exports = {
    addPosts,
    getAllPosts,
    addCommentToPost,
    getCommentsByPost,
    updatePost,
    deletePost,
    getPostById,
    likePost,
    unlikePost
};
