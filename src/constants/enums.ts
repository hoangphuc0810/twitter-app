export enum UserVerifyStatus {
  Univerfied,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MeidaType {
  Image,
  Video,
  HLS
}

export enum EncodingStatus {
  Pending, //đang chờ ở hàng đợi (chưa được encode)
  Processing, //đang encode
  Success, //Encode thành công
  Failed //Encode thất bại
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudiance {
  Everyone,
  TwitterCircle
}
