import 'reflect-metadata'
import 'dotenv/config'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'
import express, { Application } from 'express'
import { useExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import path from 'path'

const port = 8085
const app: Application = express()
const host = process.env.VITE_OBP_EXPLORER_HOST
const httpsOrNot = host ? (host.indexOf('https://') == 0 ? true : false) : true

// Initialize client.
console.log(`--- Redis setup -------------------------------------------------`)
process.env.VITE_OBP_REDIS_URL
  ? console.log(`VITE_OBP_REDIS_URL: ${process.env.VITE_OBP_REDIS_URL}`)
  : console.log(`VITE_OBP_REDIS_URL: undefined connects to localhost on port 6379`)
console.log(`-----------------------------------------------------------------`)
let redisClient = process.env.VITE_OBP_REDIS_URL
  ? createClient({ url: process.env.VITE_OBP_REDIS_URL })
  : createClient()
redisClient.connect().catch(console.error)


// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: 'api-explorer-ii:'
})

console.info(`Environment: ${app.get('env')}`)
app.use(express.json())
let sessionObject = {
  store: redisStore,
  secret: process.env.VITE_OPB_SERVER_SESSION_PASSWORD,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 300 * 1000 // 5 minutes in milliseconds
  }
}
if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionObject.cookie.secure = true // serve secure cookies
}
app.use(session(sessionObject))
useContainer(Container)

const routePrefix = '/api'

const server = useExpressServer(app, {
  //routePrefix: '/api/v1',
  routePrefix: routePrefix,
  controllers: [path.join(__dirname + '/controllers/*.*s')],
  middlewares: [path.join(__dirname + '/middlewares/*.*s')]
})

export const instance = server.listen(port)

console.log(
  `Backend is running. You can check a status at http://localhost:${port}${routePrefix}/status`
)

export default app
