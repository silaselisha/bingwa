import app, { logger } from './app'
import db from './utils/db'

const port: string = process.env.PORT ?? '8080'
const DB_PASSWORD: string = process.env?.DB_PASSWORD ?? ''
const URI: string = process.env.DB_URI?.replace('<password>', DB_PASSWORD) ?? ''

app.listen(port, () => {
  void db(URI)
  logger.info(`Listening http://localhost:${port}`)
})
