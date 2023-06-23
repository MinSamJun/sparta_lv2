// 회원 정보의 스키마를 관리하는 문서

//회원정보(user) Schema

// 몽구스 호출
const mongoose = require('mongoose');

// 몽구스의 기능으로 스키마를 만든다.
const UserSchema = new mongoose.Schema({
    nickname: { // 필드명
        type: String, // 문자열 타입
        minlength: 3, // 최소 글자 수
        unique: true, // 중복 되지 않는 값이라는 의미
    },

    password: {
        type: String,
        minlength: 4,
    },
});

// 스키마에 userId 라는 가상의 필드를 넣는다. 16진법으로 한다.
UserSchema.virtual("userId").get(function () {
    return this._id.toHexString();
  });
  // 스키마를 제이슨으로 변환 할 때 가상의 값도 포함한다.
  UserSchema.set("toJSON", {
    virtuals: true,
  });


module.exports = mongoose.model('User', UserSchema);