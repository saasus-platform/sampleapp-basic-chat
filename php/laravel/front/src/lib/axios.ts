import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

const sleep = (second: number) =>
  new Promise((resolve) => setTimeout(resolve, second * 1000))

type Jwt = {
  [name: string]: string | number | boolean
}

const decodeJwt = (token: string): Jwt => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(decodeURIComponent(escape(window.atob(base64)))) as Jwt
}

const getNewIdToken = async (): Promise<string> => {
  try {
    const { data } = await Axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh`,
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        withCredentials: true,
      }
    )
    if (!data?.id_token || !data?.access_token) {
      throw new Error('failed to get new credentials')
    }
    return data.id_token as string
  } catch (err) {
    console.error(err)
    throw new Error('failed to get new credentials')
  }
}

const onReqFulfilled = async (config: AxiosRequestConfig) => {
  if (!config?.headers) {
    return config
  }
  const authorizationHeader = config.headers.Authorization as string
  const idToken = authorizationHeader?.split(' ')[1]
  if (!idToken) {
    return config
  }

  let decodedIdToken: Jwt
  try {
    decodedIdToken = decodeJwt(idToken)
  } catch (err) {
    console.error(err)
    // リダイレクト処理などを入れる
    return
  }
  const expireDate = decodedIdToken['exp'] as number
  const timestamp = parseInt(Date.now().toString().slice(0, 10))
  // トークンの有効期限が切れている場合は新しいトークンを取得する
  if (expireDate <= timestamp) {
    try {
      const newIdToken = await getNewIdToken()
      config.headers.Authorization = `Bearer ${newIdToken}`
      window.localStorage.setItem('SaaSusIdToken', newIdToken)
      // JWTを更新してすぐ使用すると、Token used before used エラーになるため。
      // ref: https://github.com/dgrijalva/jwt-go/issues/383
      await sleep(1)
      return config
    } catch (err) {
      console.error(err)
      // リダイレクト処理などを入れる
    }
  }
  return config
}

const onResFulfilled = (res: AxiosResponse) => res
const onResRejected = async (error: AxiosError) => {
  if (!error?.response) {
    return Promise.reject(error)
  }
  if (error?.response.status !== 401) {
    return Promise.reject(error)
  }
  const config = error.config
  if (!config.headers) {
    return Promise.reject(error)
  }
  try {
    const newIdToken = await getNewIdToken()
    config.headers.Authorization = `Bearer ${newIdToken}`
    window.localStorage.setItem('SaaSusIdToken', newIdToken)
    // JWTを更新してすぐ使用すると、Token used before used エラーになるため。
    // ref: https://github.com/dgrijalva/jwt-go/issues/383
    await sleep(1)
    return config
  } catch (err) {
    console.error(err)
    // リダイレクト処理などを入れる
  }
  return
}

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
})

axios.interceptors.request.use(onReqFulfilled)
axios.interceptors.response.use(onResFulfilled, onResRejected)

export default axios
