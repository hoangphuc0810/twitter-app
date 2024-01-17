import { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { FindOptions, ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGE } from '~/constants/message'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.service'
import usersService from '~/services/users.service'
import { checkPassword, hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const { checkEmailVerifyTokenExist } = usersService

// schema

const passwordSchema: ParamSchema = {
  notEmpty: true,
  isString: true,
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 50
    }
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },
  errorMessage: 'mật khẩu có ít nhất 6 kí tự , bao gồm chứa 1 chữ thường , 1 chữ hoa , 1 số , 1 ký tự đặc biệt'
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGE.IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGE.MUST_BE_STRING
  },
  trim: true,
  isLength: {
    errorMessage: USERS_MESSAGE.COMFRIM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
    options: {
      min: 6,
      max: 50
    }
  },
  isStrongPassword: {
    errorMessage: USERS_MESSAGE.CONFRIM_PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGE.COMFRIM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      try {
        if (!value) {
          throw new ErrorWithStatus({ message: USERS_MESSAGE.IS_REQUIRED, status: HTTP_STATUS.BAD_REQUEST })
        }

        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRET_KEY as string
        })
        const { user_id } = decoded_forgot_password_token
        const options = {}
        const payload = {
          _id: new ObjectId(user_id)
        }
        const { forgot_password_token } = (await usersService.findUser(payload, options)) as User

        if (!forgot_password_token) {
          throw new ErrorWithStatus({ message: USERS_MESSAGE.NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
        }
        if (forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGE.VALUE_INVALID,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError)
          throw new ErrorWithStatus({ message: error.message, status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
        throw error
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  isLength: {
    errorMessage: USERS_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
    options: {
      min: 6,
      max: 100
    }
  },
  isString: {
    errorMessage: USERS_MESSAGE.MUST_BE_STRING
  },
  notEmpty: {
    errorMessage: USERS_MESSAGE.IS_REQUIRED
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    errorMessage: USERS_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601,
    options: {
      strict: true,
      strictSeparator: true
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGE.MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGE.IMAGE_LENGTH
  },
  trim: true
}

const followSchema: ParamSchema = {
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({ message: USERS_MESSAGE.VALUE_INVALID, status: HTTP_STATUS.BAD_REQUEST })
      }

      const options: FindOptions = {}
      const payload = {
        _id: new ObjectId(value)
      }
      const user_exist = await usersService.findUser(payload, options)

      if (!user_exist) {
        throw new ErrorWithStatus({ message: USERS_MESSAGE.NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
      }

      return true
    }
  }
}

// method validator

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        isEmail: {
          errorMessage: USERS_MESSAGE.VALUE_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const email = value
            const result = await databaseService.users.findOne({ email })

            if (!result) {
              throw new Error(USERS_MESSAGE.NOT_FOUND)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: true,
        isString: true,
        trim: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          }
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          }
        },
        custom: {
          options: async (value, { req }) => {
            const { email } = req.body
            const user = await databaseService.users.findOne({ email })
            const checkPasswordIsMatch = await checkPassword(value, user?.password as string)
            if (!checkPasswordIsMatch) {
              throw new Error('password is not match')
            }
            req.user = user
            return true
          }
        },
        errorMessage: 'mật khẩu có ít nhất 6 kí tự , bao gồm chứa 1 chữ thường , 1 chữ hoa , 1 số , 1 ký tự đặc biệt'
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGE.IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        isEmail: {
          errorMessage: USERS_MESSAGE.VALUE_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const email = value
            const result = await usersService.checkEmailExist(email)

            if (result) {
              throw new Error(USERS_MESSAGE.EMAIL_ALREADY_EXIST)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        custom: {
          options: async (value, { req }) => {
            const access_token = value.split(' ')[1]

            if (!access_token) {
              throw new ErrorWithStatus({ message: USERS_MESSAGE.IS_REQUIRED, status: HTTP_STATUS.UNAUTHORIZED })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretKey: process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            try {
              if (!value) {
                throw new ErrorWithStatus({ message: USERS_MESSAGE.IS_REQUIRED, status: HTTP_STATUS.BAD_REQUEST })
              }
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretKey: process.env.JWT_REFRESH_TOOKEN_SECRET_KEY as string }),
                databaseService.refreshToken.findOne({ token: value })
              ])
              if (!refresh_token) {
                throw new ErrorWithStatus({ message: USERS_MESSAGE.NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError)
                throw new ErrorWithStatus({ message: error.message, status: HTTP_STATUS.UNAUTHORIZED })
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({ message: USERS_MESSAGE.IS_REQUIRED, status: HTTP_STATUS.BAD_REQUEST })
            }

            const emailVerifyTokenExist = await checkEmailVerifyTokenExist(value)

            if (!emailVerifyTokenExist) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            const decoded_email_verify_token = await verifyToken({
              token: value,
              secretKey: process.env.JWT_EMAIL_VERIFY_TOOKEN_SECRET_KEY as string
            })
            ;(req as Request).decoded_email_verify_token = decoded_email_verify_token

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGE.MUST_BE_STRING
      },
      isEmail: {
        errorMessage: USERS_MESSAGE.VALUE_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const email = value
          const user = await databaseService.users.findOne({ email })

          if (!user) {
            throw new Error(USERS_MESSAGE.NOT_FOUND)
          }
          ;(req as Request).user = user
          return true
        }
      }
    }
  })
)

export const verifyForgotPasswordToken = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    forgotPasswordToken: forgotPasswordTokenSchema
  })
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({ message: USERS_MESSAGE.USER_NOT_VERIFIED, status: HTTP_STATUS.FORBIDDEN })
  }
  next()
}

export const updateProfileValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          }
        },
        trim: true,
        errorMessage: USERS_MESSAGE.BIO_LENGTH
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGE.LOCATION_LENGTH
        },
        trim: true
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGE.WEBSITE_LENGTH
        },
        trim: true
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGE.MUST_BE_STRING
        },
        custom: {
          options: async (value, { req }) => {
            // regex username
            if (!REGEX_USERNAME.test(value)) {
              throw new Error(USERS_MESSAGE.USERNAME_INVALID)
            }

            // check username exist
            const payload = {
              username: value
            }
            const options = {}
            const usernameExist = await usersService.findUser(payload, options)

            if (usernameExist) {
              throw new ErrorWithStatus({
                message: `username ${USERS_MESSAGE.VALUE_EXIST}`,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        },
        trim: true
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: followSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: followSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value, { req }) => {
          const { user_id } = (req as Request).decoded_authorization as TokenPayload
          const payload = {
            _id: new ObjectId(user_id)
          }
          const options: FindOptions<Document> = {}
          const user_exist = await usersService.findUser(payload, options)
          if (!user_exist) {
            throw new ErrorWithStatus({ message: USERS_MESSAGE.NOT_FOUND, status: HTTP_STATUS.BAD_REQUEST })
          }

          const { password } = user_exist
          const passwordIsMatch = await checkPassword(value, password)

          if (!passwordIsMatch) {
            throw new ErrorWithStatus({
              message: `password ${USERS_MESSAGE.NOT_MATCH}`,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          return true
        }
      }
    },
    password: passwordSchema,
    confrim_password: confirmPasswordSchema
  })
)
