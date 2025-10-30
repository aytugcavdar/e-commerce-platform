import Spinner from './Spinner'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Loading = ({ 
  fullScreen = false, 
  message = 'Yükleniyor...',
  size = 'lg'
}: LoadingProps) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Spinner size={size} />
          {message && (
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size={size} />
        {message && (
          <p className="mt-4 text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

export default Loading