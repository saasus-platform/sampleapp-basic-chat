import Container from '@mui/material/Container'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Axios from 'axios'

const Callback = () => {
  const router = useRouter()
  const query = router.query
  const code = query.code as string

  const fetchAuthCredentials = async () => {
    const res = await Axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/callback?code=${code}`,
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        withCredentials: true,
      },
    )
    // 渡ってきたJWTをLocal Storageに保存する
    const idToken = res.data.id_token as string
    localStorage.setItem('SaaSusIdToken', idToken)
    router.replace('/board')
  }

  useEffect(() => {
    if (router.isReady) {
      if (code) {
        fetchAuthCredentials()
      }
    }
  }, [query, router])

  return <Container disableGutters></Container>
}

export default Callback