import { MessageBoard } from '@/components/MessageBoard'
import { formValueFormat } from '@/const/formTemplate'
import Container from '@mui/material/Container'
import useSWR, { useSWRConfig } from 'swr'
import axios from '@/lib/axios'

const Board = () => {
  const { mutate } = useSWRConfig()
  const fetcher = (url: string) => {
    // Local StorageからJWTを取得し、Bearer tokenとしてヘッダにつけてAPIコールする
    const token = localStorage.getItem('SaaSusIdToken')
    if (!token) return ''
    return axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.data)
  }
  const { data: tenant_name, error: tenant_error } = useSWR(
    `/api/tenant`,
    fetcher
  )
  const { data: messages, error } = useSWR(`/api/board`, fetcher, {
    refreshInterval: 5000,
  })
  if (error || tenant_error) return <div>failed to load</div>
  if (!messages || !tenant_name) return <div>loading...</div>

  const handleSubmit = async (value: string) => {
    const formValue = { ...formValueFormat, message: value }
    // 再検証をせずに直ちにローカルデータを更新
    mutate('/api/board', [...messages, formValue], false)
    // 更新するために API にリクエストを送信
    // Local StorageからJWTを取得し、Bearer tokenとしてヘッダにつけてAPIコールする
    const token = localStorage.getItem('SaaSusIdToken')
    await axios.post('/api/post', formValue, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  return (
    <Container disableGutters>
      <MessageBoard
        messages={messages}
        tenant_name={tenant_name}
        onSubmit={handleSubmit}
      />
    </Container>
  )
}

export default Board
