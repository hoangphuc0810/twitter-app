import express from 'express'
import usersRouter from './routers/users.router'
import databaseService from './services/database.service'
import { defaultErrorHandler } from './middlewares/errors.middleware'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import mediasRouter from './routers/medias.router'
import staticRouter from './routers/static.router'
import cors from 'cors'
import tweetsRouter from './routers/tweet.router'
import bookMarkRouter from './routers/bookmarks.router'
config()

databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexFollower()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
})

const app = express()
app.use(cors())
const port = process.env.PORT || 4000

initFolder()

app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweet',tweetsRouter)
app.use('/bookmarks',bookMarkRouter)
// app.use('/image',express.static(UPLOAD_IMAGE_DIR))
app.use(defaultErrorHandler)

app.listen(port)
