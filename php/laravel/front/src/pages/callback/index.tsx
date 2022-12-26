import Container from '@mui/material/Container'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import axios from '@/lib/axios'

const Callback = () => {
  const router = useRouter()
  const query = router.query
  const code = query.code as string

  const fetchAuthCredentials = async () => {
    const res = await axios.get(`/api/callback?code=${code}`)
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