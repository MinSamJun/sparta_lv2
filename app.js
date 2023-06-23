// 패키지 불러오기.
const express = require("express");
const app = express();
const Joi = require("joi");
const router = express.Router();

//인증절차
// JWT
const jwt = require("jsonwebtoken");
// 미들웨어
const authMiddleware = require("./middlewares/auth-middleware");

//models 불러오기, 스키마들과 연결하기
const Contents = require('./models/contents');//게시글 Schema
const Comment = require('./models/comment');// 댓글 Schema
const User = require('./models/user');// user schema
const connect = require("./models"); //몽고디비 연결

connect(); //몽고디비 연결

// url 파싱
app.use(express.urlencoded({ extended: false }));
// json 파싱
app.use(express.json());
// 라우팅 설정
app.use("/api", express.json(), router);
// 상태 코드 보내기
app.get("/users", (req, res) => {
    res.status(200).json({});
});
// 상태 코드 보내기
app.get("/contents", (req, res) => {
    res.status(200).json({});
});

// joi 라이브러리를 사용하여서 유효성 검사를 진행한다.
const postUsersSchema = Joi.object({
    nickname:
        Joi.string() // 스트링 타입
            .required() // 필수입력
            //        정규식으로   문자,숫자만 3~30글자제한.
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    password:
        Joi.string()
            .required()
            .min(4), //최소 4글자.
    checkPassword:
        Joi.string()
            .required()
            .min(4),
});

//회원가입 API         비동기
router.post("/users", async (req, res) => {
    try {
        // 구조 분해 할당
        const { nickname, password, checkPassword } =
            // await 비동기 수행중에 잠시 멈추는 것.
            await postUsersSchema.validateAsync(req.body); //body로 입력 받은 값을 스키마와 비교한다. = 유효성 검사
            //                    ↑ 프로미스를 반환하기 때문에 await을 사용한다.

        //비밀번호에 닉네임이 들어갔는지 확인
        if (password.includes(nickname)) {
            res.status(400).send({ // 들어갔으면 에러를 뱉는다.
                errorMessage: "비밀번호에 닉네임과 같은 값이 포함되면 안됩니다."
            });
            return;
        }

        // 비밀번호를 두 번 연속 같게 입력했는지 확인하기.
        if (password !== checkPassword) {
            res.status(400).send // 다르게 입력하면 에러를 뱉는다.
                ({ errorMessage: "비밀번호를 다시 확인해주세요." });
            return;
        }
        // 중복 닉네임 확인하기.
        //    existUsers에 중복된 닉네임을 저장한다.
        const existUsers = await User.find({
            $or: [{ nickname }], // nickname 필드 값이 주어진 값과 같은 도큐먼트를 찾는다.
        });
        // 길이가 있다 = 데이터가 있다 = 중복된 닉네임이 있다.
        if (existUsers.length) {
            res.status(400).send
                ({ errorMessage: "중복된 닉네임 입니다." });
            return;
        }

        // 위의 것들을 피했다면 중복이 아니다.
        const users = new User({ nickname, password });
        // DB의 users라는 모델 저장한다.
        await users.save();

        res.status(201).send({});
    } 
    // 스키마와 일치하지 않으면 에러를 띄운다.
    catch (err) {
        res.status(400).send({
            errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
        });
    }
});

//로그인 API
router.post("/auth", async (req, res) => {
    try {
        const { nickname, password } = req.body;

        //               User에서 ↓  ↓ 하나만 찾는다. ↓ nickname 과 일치하는 도큐먼트
        const usersinfo = await User.findOne({ nickname }).exec();
        // 쿼리를 실행하고, 결과를 promise의 형태로 받을 수 있다. ↑ 
        // console.log(usersinfo)
        
        //  일치하는 닉네임이 없거나(||) 비밀번호가 일치하지 않으면
        if (!usersinfo || password !== usersinfo.password) {
            res.status(400).send({ // 에러메세지를 내보낸다.
                errorMessage: "닉네임 또는 패스워드를 확인해주세요."
            });
            return;
        }

        // JWT로 토큰을 만든다.        ayload에 넣을 값          비밀키
        const token = jwt.sign({ userId: usersinfo.userId }, "my-secret-key1");
        res.send({ // 완성된 토큰을 클라이언트에게 보낸다.
            token,
        });
        // 에러 출력을 위한 부분
    } catch (err) {
        res.status(400).send({
            errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
        });
    }
});

//내정보 불러오기
//                     미들웨어로 로그인 확인
router.get("/users/me", authMiddleware, async (req, res) => {
    // 미들웨어에서 내 ID를 가져온다.
    const { userId } = res.locals;
    // console.log(user) 이게 왜 안나올까..? =>이제나옴
    // require할때 변수에 {} 쳐놔서 그럼. => MySQL쓸때 설정해놓은걸 안바꿈

    // 클라이언트에게 내 ID를 보낸다.
    res.send({
        userId,
    });
});

//게시글 전체조회
router.get("/contents", async (req, res) => {
    //     닉네임은 겹치지 않게 만들었으니 ↓ findone 이지만, 게시글은 다 찾아야하니 find 다.
    const AllContents = await Contents.find({});
    res.json({ AllContents });
});

// 게시글 작성하기
router.post("/contents", authMiddleware, async (req, res) => {
    // 미들웨어에서 사용자의 id 가져오기
    const { userId } = res.locals.user;
    // post로 게시글 내용 보낸걸 할당한다.
    const { title, content, articlePassword } = req.body;

    const creatcontents =
        // mongoose 의 기능으로 위에서 가져온 값들(userId, title, content, articlePassword)로 게시글을 만든다.
        await Contents.create({ userId, title, content, articlePassword });
        // Contents : 모델명
        // create : 매서드
    res.status(201).json({ result: 'success', msg: '글이 등록되었습니다.' });
});

//게시글 수정
router.put("/contents/detail/:contentId", authMiddleware, async (req, res) => {
    // 미들웨어서 로그인 한 사람 id를 가져온다.
    const { userId } = res.locals.user;
    const { contentId } = req.params;
    const { title, detail, articlePassword } = req.body;

    // 작성자 id와 로그인 id가 같은 걸 찾는다.
    const existsContentsId = await Contents.find(userId);

    // existsContentsId 의 길이가 0 이다 = 로그인 한 id와 같은 작성 id의 게시글이 없다.
    if (!existsContentsId.length) {
        return res.status(400).json({ errorMessage: "게시물이 존재하지 않습니다." });
    }

    // id도 비밀번호도 같아야한다.
    if ((existsContentsId[0].userId === userId) && (existsContentsId[0].articlePassword === articlePassword)) {
        await Contents.updateOne({ contentId }, { $set: { title, detail } });

    };

    res.json({ success: true });
});

//게시글 삭제
router.delete("/contents/detail/:contentId", authMiddleware, async (req, res) => {
    // 삭제하기전에 정보를 한번 더 확인한다.
    const { userId, articlePassword, contentId } = req.body;

    // existsContentsId 모델에서 contentId도큐먼트를 찾는다.
    const existsContentsId = await Contents.find(contentId);
    //  도큐먼트가 존재하고             작성자가 일치하고                           비밀번호도 일치하면
    if ((existsContentsId.length) && (existsContentsId[0].userId === userId) && (existsContentsId[0].articlePassword === articlePassword)) {
        //     모델에서  지운다   아이디가 같은 컨텐츠를
        await Contents.deleteOne(contentId);
    }
    res.json({ success: true });
})

//댓글목록 조회
router.get("/contents/:contentId/detail/comments", async (req, res) => {
    //코멘트를 전부 가져온다            생성 시간 기준으로: 내림차순 정렬(-1)
    const comments = await Comment.find({}).sort({ createdAt: -1 });
    res.json({ comments });
});

//댓글 작성하기
router.post('/contents/:contentId/detail/comments', authMiddleware, async (req, res) => {
    // 로그인 한 id
    const { userId } = res.locals.user;
    // 지금 보는 글의 id
    const { contentId } = req.params;
    // 입력한 코멘트 내용
    const { comment } = req.body;

    // 오류 처리 = 필수 값 입력 확인
    // 코멘트 값이 없다면 오류 출력
    if (comment === null) {
        res.status(400).send({ msg: "댓글 내용을 입력해주세요." })
    }
    // 유저 아이디가 없다 = 로그인이 안되어 있다면 오류 출력
    if (userId === null) {
        res.status(400).send({ msg: "로그인이 필요한 기능입니다." })
    }

    // postArticle 라는 모델에 코멘트를 만든다.
    const postArticle = await Comment.create({
        userId,
        contentId,
        comment,
    });
    res.status(201).json({ article: postArticle, msg: "댓글이 등록되었습니다." });
});

//댓글 수정하기
router.put("/contents/:contentId/detail/comments/:commentId", authMiddleware, async (req, res) => {
    // 로그인 한 사람의 id를 가져온다.
    const { userId } = res.locals.user;
    // 현재 보고 있는 코멘트의 id
    const { commentId } = req.params;
    // 수정할 내용물
    const { comment } = req.body;

    // 수정할 댓글의 id를 입력 받는다.
    const existsComment = await Comment.findById(commentId).exec();
    console.log(existsComment)

    // 로그인 한 사람과 작성자와 일치하면
    if (existsComment.userId === userId) {
        // 새로 입력한 코멘트로 업데이트한다.
        await existsComment.updateOne({ comment }, { $set: { comment } })
    };
    res.json({ success: true });
});

//댓글 삭제하기
router.delete("/contents/:contentId/detail/comments/:commentId", authMiddleware, async (req, res) => {
    // 로그인 한 id
    const { userId } = res.locals.user;
    // 보고 있는 댓글 id
    const { commentId } = req.params;

    // 코멘트를 찾는다.
    const existsComment = await Comment.findById(commentId).exec();
    // 작성자와 같은 사람이면
    if (existsComment.userId === userId) {
        // 코멘트를 지운다.
        await existsComment.delete();
    };
    res.json({ success: true });
});

const port = 8080;
app.listen(port, () => {
    console.log(port, "포트로 서버 On!");
});
