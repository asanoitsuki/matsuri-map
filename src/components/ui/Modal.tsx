'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  fullScreen?: boolean
}

export function Modal({ isOpen, onClose, title, children, fullScreen = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`
          relative bg-white w-full animate-slide-up
          ${fullScreen
            ? 'h-full rounded-none'
            : 'max-h-[90vh] rounded-t-3xl sm:rounded-3xl sm:max-w-2xl overflow-y-auto'
          }
        `}
      >
        {title && (
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
            <h2 className="text-lg font-bold text-matsuri-dark">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
