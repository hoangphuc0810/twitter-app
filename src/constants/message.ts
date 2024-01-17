export const USERS_MESSAGE = {
  VALIDATION_ERROR: 'Validation error',
  MUST_BE_STRING: 'must be a string',
  IS_REQUIRED: 'must be not required',
  VALUE_INVALID: 'value invalid',
  NOT_FOUND: 'not found',
  AUTHORIZATION: 'bạn không có quyền truy cập',
  USER_NOT_VERIFIED: 'user not verified',
  VALUE_EXIST: 'Value exist',
  NOT_MATCH: 'Not match',
  UPLOAD_IMAGE_SUCCESS: 'Upload image success',
  USER_HAVE_BEEN_BANNED: 'user have been banned',

  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',

  EMAIL_ALREADY_EXIST: 'Email already exist',

  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  PASSWORD_MUST_BE_A_STRING: 'pass word must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  PASSWORD_MUST_BE_STRONG: 'Password must be strong',
  PASSWORD_RESET_SUCCESS: 'password reset success',
  FORGOT_PASSWORD_TOKEN_VERIFY_SUCCESS: 'For got password token verify success',
  COMFRIM_PASSWROD_MUST_BE_A_STRING: 'Comfrim password must be a string',
  COMFRIM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Comfrim password length must be from 6 to 50',
  CONFRIM_PASSWORD_MUST_BE_STRONG:
    'Comfrim password must be 6-50 characters long and contain at least 1, lowercase letter, 1 uppercase letter ,1 number and 1 symbol.',
  COMFRIM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Comfrim password must be the same as password',

  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already veryfied before',
  EMAIL_UNVERIFIED: 'Email unverified',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'check email to reset password',

  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601',

  BIO_LENGTH: 'Bio length must be from 1 to 200',
  LOCATION_LENGTH: 'Location length must be from 1 to 200',
  WEBSITE_LENGTH: 'Website length must be from 1 to 200',
  USERNAME_LENGTH: 'Username length must be from 1 to 50',
  IMAGE_LENGTH: 'Cover photo length must be from 1 to 400',

  FOLLOWED: 'user_id have been followed',
  FOLLOW_SUCCESS: 'Follow success',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  HAVE_BEEN_UNFOLLOWED: 'Have been unfollow',

  UPDATE_PROFILE_SUCCESS: 'Update profile success',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',

  USERNAME_INVALID: 'username must be 4-15 characters long and contain only letters,numbers,undercores '
} as const

export const TWEET_MESSAGE = {
  INVALID: 'INVALID',
  CREATED_SUCCESS: 'created success',
  NOT_FOUND: 'not found',

  PARENT_ID_MUST_BE_NULL: 'parent id must be null',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'parent id must be a valid tweet id',

  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'content must be a non empty string',
  CONTENT_MUST_BE_EMPTY_STRING: 'content must be empty string',

  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'hashtags must be an array of string',

  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'mentions must be an array of user_id',

  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJ: 'medias must be an array of medias obj',

  YOU_ARE_NOT_AUTHOR_OR_YOU_ARE_NOT_ON_THE_LIST: 'you are not the author or you are not on the list',

  TWEET_IS_NOT_PUBLIC:'tweet is not public'
} as const

export const BOOKMARK_MESSAGE = {
  CREATED_SUCCESS: 'created success',
  DELETE_SUCCESS: 'deleted success'
} as const
