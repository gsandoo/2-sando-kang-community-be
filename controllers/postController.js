const responseFormatter = require('../util/ResponseFormatter');
const postModel = require('../models/postModel');
const authModel = require('../models/authModel');
const commentModel = require('../models/commentModel');


//NOTE: posts.js 연동 - 게시글 목록 조회
exports.getPosts = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 5;
    const startIndex = (page - 1) * pageSize;

    postModel.getPaginatedPosts(startIndex, pageSize, async (err, posts) => {
        if (err) {
            return res.status(500).json(responseFormatter(false, 'server_error'));
        }
        try {
            // 모든 게시글에 대한 정보 가져오기
            const postData = await Promise.all(postPromises);
            res.json(responseFormatter(true, 'post_get_success', { posts: postData }));
        } catch (error) {
            res.status(500).json(responseFormatter(false, 'server_error'));
        }
    });
};

//NOTE: post.js연동 - 게시글 + 댓글 정보 조회
exports.getPostsById = async (req, res) => {
    const { postId } = req.params;

    console.log(`postId: ${postId}`);
    
    try {
        const post = await postModel.getPostById(postId);
        console.log(post);

        const user = await authModel.findUserById(post.user_id);
        const author = user ? user.nickname : 'Unknown';
        const profileImg = user ? user.profile : 'default.png';

        const comments = await commentModel.findCommentsByPostId(postId);

        console.log(comments);
        const formattedComments = comments.map((comment) => ({
            id: comment.id,
            content: comment.comment,
            author: comment.author || 'Unknown',
            date: comment.date,
        }));

        const postData = {
            post_id: post.id,
            title: post.title,
            content: post.content,
            updatePostDate: post.date,
            image: post.image,
            author: author,
            profile: profileImg,
            likesCnt: post.likes,
            viewsCnt: post.views,
            commentsCnt: post.comments,
            comment: formattedComments, 
        };

        res.json(responseFormatter(true, 'register_success', { postData }));
        
    } catch (error) {
        console.error('Error fetching post, comments or user data:', error);
        return res.status(500).json(responseFormatter(false, 'server_error'));
    }
};



//NOTE: 게시글 작성
exports.createPost = (req, res) => {
    const { user_id, title, content, image } = req.body;
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    postModel.createPost(user_id, title, content, image, date, (err, postId) => {
        if (err) {
            return res.status(500).json(responseFormatter(false, 'server_error'));
        }
        res.json(responseFormatter(true, 'register_success', { postId }));
    });
};

//NOTE: 특정 게시글 조회
exports.getPostById = (req, res) => {
    const { user_id, post_id } = req.query;

    postModel.getPostById(user_id, post_id, (err, post) => {
        if (err) {
            return res.status(500).json(responseFormatter(false, 'server_error'));
        }
        if (!post.length) {
            return res.status(400).json(responseFormatter(false, 'post_not_found'));
        }
        res.json(responseFormatter(true, 'post_get_success', { post: post[0] }));
    });
};

//NOTE: 게시글 수정
exports.updatePost = (req, res) => {
    const { user_id, post_id, title, content, date } = req.body;
    const image = req.file ? req.file.buffer.toString('base64') : null; // 이미지 파일을 Base64로 변환 (필요 시)
    console.log(`user_id : ${user_id}`);
    console.log(`post_id : ${post_id}`);
    console.log(`title : ${title}`);
    console.log(`content : ${content}`);
    console.log(`image : ${image ? '이미지가 있습니다.' : '이미지가 없습니다.'}`);

    // 데이터베이스에 저장
    postModel.updatePost(user_id, post_id, title, content, image, date, (err, result) => {
        if (err) {
            return res.status(500).json(responseFormatter(false, 'server_error'));
        }
        res.json(responseFormatter(true, 'update_success'));
    });
};


//NOTE: 게시글 삭제
exports.deletePost = (req, res) => {
    const { user_id, post_id } = req.body;

    postModel.deletePost(user_id, post_id, (err, result) => {
        if (err) {
            return res.status(500).json(responseFormatter(false, 'server_error'));
        }
        res.json(responseFormatter(true, 'delete_success'));
    });
};
