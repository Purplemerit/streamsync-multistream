import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../../utils/axios'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/common/Loader'

export default function GoogleAuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    const token = tokenFromUrl || localStorage.getItem('token')

    if (!token) {
      navigate('/login', {
        replace: true,
        state: { error: 'Google login failed, please try again' },
      })
      return
    }

    localStorage.setItem('token', token)
    API.get('/auth/me')
      .then((res) => {
        login(token, res.data)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        navigate('/login', {
          replace: true,
          state: { error: 'Google login failed, please try again' },
        })
      })
  }, [searchParams, navigate, login])

  return <Loader />
}
