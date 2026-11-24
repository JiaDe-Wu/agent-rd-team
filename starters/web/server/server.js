// Entry point: npm start. The port is the environment variable PORT (default 3000); it listens only on HOST (default 127.0.0.1).
import { createApp } from './app.js'

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'

createApp().listen(port, host, () => {
  console.log(`Started: http://${host}:${port}`)
})
