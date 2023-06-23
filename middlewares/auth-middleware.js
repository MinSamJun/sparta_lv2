// 패키지 호출
const jwt = require("jsonwebtoken");
// 스키마 호출
const User  = require("../models/user");

// 미들웨어 함수를 정의한다.
module.exports = (req, res, next) => {
    // 토큰을 만든다.
    const { authorization } = req.headers;
    // 토큰 타입과 토큰 값 사이에 공백을 기준으로 두 개로 나눈다.
    const [tokenType, tokenValue] = authorization.split(" ");

    // 토큰의 타입이 Bearer 가 아니라면
    if (tokenType != "Bearer") {
      res.status(401).send({ // 에러를 내보낸다.
        errorMessage: "로그인이 필요합니다.",
      });
      return;
    }

    // if (tokenType === "Bearer") {
    //   res.status(201).send({
    //     result: "true",
    //     status: 201,
    //     errorMessage: "이미 로그인이 되어 있습니다.",
    //   });
    // }

    try {// jwt.verify 로 토큰을 검증하고, 유효하면 userId에 담는다. 토큰 값은 위에서 공백을 기준으로 split 했던 것이다.
      const { userId } = jwt.verify(tokenValue, "my-secret-key1");
      // DB에서 사용자를 찾는다.
      User.findById(userId).exec()
      .then((user) => {
          res.locals.user = user;
          console.log(user)
          next();
      });
      

    } catch (err) {
    res.status(401).send({
      errorMessage: "로그인이 필요합니다.",
    });
    return;
  }

};