import { useInView } from '../../hooks/useInView'

export default function ScrollReveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView({ once: true })

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
