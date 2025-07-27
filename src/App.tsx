import { useState } from 'react'
import LatvianTextTest from '@/components/LatvianTextTest'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Latvijas Pilsonības Naturalizācijas Eksāmens
          </h1>
          <p className="text-lg text-gray-600">
            Prakses eksāmens pilsonības iegūšanai
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          {/* Vite + React demonstration */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Vite + React + TypeScript
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setCount((count) => count + 1)}
              >
                Skaits ir {count}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setCount(0)}
              >
                Atiestatīt
              </button>
            </div>
            <p className="text-gray-600">
              Rediģējiet{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">src/App.tsx</code>{' '}
              un saglabājiet, lai redzētu izmaiņas.
            </p>
          </div>

          {/* Latvian Character Test */}
          <LatvianTextTest />

          {/* Project Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Projekta Informācija
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Tehnoloģijas</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• React 19</li>
                  <li>• TypeScript</li>
                  <li>• Vite</li>
                  <li>• Tailwind CSS v4</li>
                  <li>• UTF-8 atbalsts</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Eksāmena Sekcijas
                </h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Valsts himna (75% nepieciešami)</li>
                  <li>• Vēstures jautājumi (7/10)</li>
                  <li>• Konstitūcijas jautājumi (5/8)</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
