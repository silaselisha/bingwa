/**
 * news services fetch trending topics in East Africa
 */

import { logger } from '../app'

const newsServices = async (): Promise<void> => {
  const url = `https://newsapi.org/v2/top-headlines?country=${'ke'}&category=${'business'}&apiKey=${process.env.NEWS_API_KEY}`
  const resp = await fetch(url)
  logger.warn(resp)
}

export default newsServices
