'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-red-600">Error</h1>
            <h2 className="text-2xl font-semibold text-gray-700">A critical error occurred</h2>
            <p className="text-gray-600 max-w-md">
              Something went wrong with the application. Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}