// jwt
// 모델
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;

  const [authType, authToken] = (authorization || '').split(' ');
  // authType: Bearer
  // authToken: 실제 jwt 값
  // console.log([authType, authToken]);

  if (authType !== 'Bearer' || !authToken) {
    res.status(401).json({
      errorMessage: '로그인 후 사용이 가능한 API 입니다.'
    });
    return;
  }

  try {
    // 복호화 및 검증
    const { userId } = jwt.verify(authToken, 'SeongHun');  // 비밀키가 다르면 에러가 발생하기 때문에 try-catch문을 써줘야한다.
    // const user = await User.findById(userId);
    // res.locals.user = user;  // res.locals에 담아 next()로 넘겨준다.
    // next();
    User.findById(userId).then((user) => {
      res.locals.user = user;
      next();
    })
  } catch(err) {
    res.status(401).json({
      errorMessage: '로그인 후 사용이 가능한 API 입니다.'
    });
  }
  return;
}