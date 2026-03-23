import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const remove = (id) => setToasts(p => p.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(({ id, msg, type }) => (
          <div
            key={id}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
              ${type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
              }`}
          >
            {type === 'success'
              ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              : <XCircle size={16} className="mt-0.5 flex-shrink-0" />
            }
            <span className="flex-1">{msg}</span>
            <button onClick={() => remove(id)} className="opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
