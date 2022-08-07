import Container from '@mui/material/Container'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Callback = () => {
  const router = useRouter()
  const query = router.query
  const idToken = query.idToken as string
  useEffect(() => {
    if (router.isReady) {
      if (idToken) {
        // 渡ってきたJWTをLocal Storageに保存する
        localStorage.setItem('SaaSusIdToken', idToken)
        router.replace('/board')
      }
    }
  }, [query, router])

  return <Container disableGutters></Container>
}

export default Callback
