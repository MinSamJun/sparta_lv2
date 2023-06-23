// 댓글의 스키마를 설정하는 곳이다.

// 패키지 호출
const mongoose = require('mongoose');

// 몽구스를 이용해서 스키마를 만든다.
const CommentSchema = mongoose.Schema(
  {// 필드명 : 필드의 속성 {문자열}
    contentId: { type: String },
    userId: { type: String },
    comment: { type: String },
    // app.js 에서 위의 값들을 모두 입력 받게 만들어서 required:true는 없다.
  },
  // 생성 시점을 기준으로 타임 스탬프를 만든다. 코멘트 자체의 id값, 순서등으로 활용할 수 있다.
  { timestamps: true }
);

//           .virtual의 commentID 는 DB에 올라가지 않는 가상의 필드다.
CommentSchema.virtual("commentId").get(function () {
  return this._id.toHexString(); // 16진법으로 만든다.
});
//                 toJSON 메소드 = 제이슨으로 만드는 것
CommentSchema.set("toJSON", {
  // 메소드 호출 시 가상의 필드도 포함시키겠다.
  virtuals: true,
});

// 모델을 내보낸다                모델명        참조할 스키마
module.exports = mongoose.model('Comments', CommentSchema);