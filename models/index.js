// mongoDB atlas 와 연결하는 문서

//몽고디비 연결

// 몽구스를 불러온다.
const mongoose = require("mongoose");

// connect 라는 이름의 함수로 mongoDG atlas 와 연결한다.
const connect = () =>{
//             몽고 디비와 연결 사용자명 : 비밀번호 @클러스터의 호스트 이름            / 설정값들
mongoose.connect("mongodb+srv://<id>>:<pass>>@cluster0.vxfylst.mongodb.net/?retryWrites=true&w=majority", 
//                               id    password는 환경 변수로 쓰자

// 스키마에서 정의하지 않은 필드는 무시한다.
{ignoreUndefined: true}).catch((err) => {
    console.error(err);}); // .catch~~~ :에러 발생시 출력
};

//         몽구스의 .connection이라는 객체를  db에 할당한다.
const db = mongoose.connection;
// 에러가 뜨면 콘솔에 띄운다.
db.on('error', console.error.bind(console, 'connection error:'));

// connect를 모듈로 내보낸다.
module.exports = connect;