import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

type Jwt = {
  [name: string]: string | number | boolean
}

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
})

const decodeJwt = (token: string) => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(decodeURIComponent(escape(window.atob(base64))))
}

const getNewTokens = async () => {
  const { data } = await Axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/new-tokens`,
    { withCredentials: true }
  )
  return data?.id_token as string
}

const onReqFulfilled = async (
  config: AxiosRequestConfig
): Promise<AxiosRequestConfig> => {
  if (!config.headers) {
    return config
  }
  const authorizationHeader = config.headers['Authorization'] as string
  if (!authorizationHeader) {
    return config
  }
  const bearerToken = authorizationHeader.split(' ')[1]
  const decodedToken = decodeJwt(bearerToken) as Jwt

  const expireDate = decodedToken['exp'] as number
  const timestamp = parseInt(Date.now().toString().slice(0, 10))

  if (expireDate <= timestamp) {
    try {
      const newToken = await getNewTokens()
      localStorage.setItem('SaaSusIdToken', newToken)
      config.headers['Authorization'] = `Bearer ${newToken}`
      return config
    } catch (err) {
      console.error(err)
    }
  }
  return config
}

const onResFulfilled = (res: AxiosResponse) => res

const onResRejected = async (error: AxiosError) => {
  if (!error?.response) {
    return Promise.reject(error)
  }
  if (error.response.status !== 401) {
    return Promise.reject(error)
  }
  const config = error.config
  if (!config?.headers) {
    return Promise.reject(error)
  }
  try {
    const newTokens = await getNewTokens()
    config.headers['Authorization'] = `Bearer ${newTokens}`
    return Axios.request(config)
  } catch (err) {
    console.error(err)
  }
  return
}

axios.interceptors.request.use(onReqFulfilled)
axios.interceptors.response.use(onResFulfilled, onResRejected)

export default axios
