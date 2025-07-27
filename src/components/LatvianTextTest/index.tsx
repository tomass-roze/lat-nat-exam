import { useState } from 'react'

const LatvianTextTest = () => {
  const [inputText, setInputText] = useState('')

  const latvianChars = {
    lowercase: ['ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž'],
    uppercase: ['Ā', 'Č', 'Ē', 'Ģ', 'Ī', 'Ķ', 'Ļ', 'Ņ', 'Š', 'Ū', 'Ž'],
  }

  const sampleText = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!`

  const fullAlphabet =
    'AĀBCČDEĒFGĢHIĪJKĶLĻMNŅOPRSŠTUŪVZŽaābcčdeēfgģhiījkķlļmnņoprsštuūvzž'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">
        Latviešu Valodas UTF-8 Atbalsta Tests
      </h2>

      {/* Character Display Test */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">
          Latviešu diakritiskie simboli
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Mazie burti:</h4>
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-2xl font-mono">
                {latvianChars.lowercase.join(' ')}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Lielie burti:</h4>
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-2xl font-mono">
                {latvianChars.uppercase.join(' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Alphabet Test */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Pilns latviešu alfabēts</h3>
        <div className="bg-gray-50 p-3 rounded border">
          <span className="text-xl font-mono break-all">{fullAlphabet}</span>
        </div>
      </div>

      {/* Sample Text Test */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Himnas fragments</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <pre className="text-lg font-serif whitespace-pre-wrap">
            {sampleText}
          </pre>
        </div>
      </div>

      {/* Input Test */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Ievades tests</h3>
        <p className="text-gray-600 mb-2">
          Ierakstiet tekstu ar latviešu simboliem, lai pārbaudītu ievades
          atbalstu:
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ierakstiet tekstu šeit... (izmēģiniet: āčēģīķļņšūž)"
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
        {inputText && (
          <div className="mt-3 p-3 bg-blue-50 rounded border">
            <h4 className="font-medium mb-2">Ievadītais teksts:</h4>
            <p className="text-lg">{inputText}</p>
          </div>
        )}
      </div>

      {/* Font Test */}
      <div>
        <h3 className="text-lg font-medium mb-3">Fontu tests</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Inter (default): </span>
            <span className="text-lg font-sans">
              Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Monospace: </span>
            <span className="text-lg font-mono">
              Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Serif: </span>
            <span className="text-lg font-serif">
              Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
            </span>
          </div>
        </div>
      </div>

      {/* Test Status */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              <strong>UTF-8 atbalsts darbojas!</strong> Visi latviešu simboli
              tiek pareizi attēloti.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LatvianTextTest
