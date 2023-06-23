// 콘텐츠의 스키마를 정의하는 문서

// 패키지 불러오기
const mongoose = require('mongoose');

// 몽구스를 이용해 스키마를 만든다.
const ContentsSchema = mongoose.Schema(
  {// 필드명 : {속성들}
    title: { type: String },
    content: { type: String },
    userId: {
      type: String, // 문자열 타입
      required: true // 반드시 있어야하는 필드이다.
    },
    articlePassword: { type: String },
  },
  { timestamps: true } // 생성 시간을 기록한다.
);


// contentId 라는 가상의 필드를 만들고 16진법으로 한다.
ContentsSchema.virtual("contentId").get(function () {
  return this._id.toHexString();
});
// 스키마를 제이슨으로 만들 때, 가상의 필드도 저장한다.
ContentsSchema.set("toJSON", {
  virtuals: true,
});

// 모델을 내보낸다.                모델명     참조할 스키마명
module.exports = mongoose.model('Contents', ContentsSchema);