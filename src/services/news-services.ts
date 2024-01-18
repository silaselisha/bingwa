import axios from 'axios'
/**
 * news services fetch trending topics in East Africa
 */
interface IOptions {
  method: string
  url: string
}

const newsServices = async (): Promise<void> => {
  console.log(process.env.NEWS_AP_KEY)
  const accessKey: string = process.env.NEWS_API_KEY ?? ''
  console.log(accessKey)

  const options: IOptions = {
    method: 'GET',
    url: `http://api.mediastack.com/v1/news?categories=sports&sources=skysports&limit=30&keywords=football soccer tenis basketball hockey&access_key=${accessKey}`
  }
  const res = await axios(options)
  console.log(res.data)
}

export default newsServices
