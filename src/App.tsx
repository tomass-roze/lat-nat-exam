import { useState } from 'react'
import LatvianTextTest from '@/components/LatvianTextTest'
import { ComponentShowcase } from '@/components/ComponentShowcase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  const [count, setCount] = useState(0)
  const [showShowcase, setShowShowcase] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Latvijas Pilsonības Naturalizācijas Eksāmens
          </h1>
          <p className="text-lg text-muted-foreground">
            Prakses eksāmens pilsonības iegūšanai
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowShowcase(!showShowcase)}
            >
              {showShowcase ? 'Paslēpt' : 'Rādīt'} shadcn/ui Komponentus
            </Button>
          </div>
        </header>

        {/* Component Showcase */}
        {showShowcase && (
          <div className="mb-8">
            <ComponentShowcase />
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          {/* Vite + React demonstration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">
                Vite + React + TypeScript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button onClick={() => setCount((count) => count + 1)}>
                  Skaits ir {count}
                </Button>
                <Button variant="secondary" onClick={() => setCount(0)}>
                  Atiestatīt
                </Button>
              </div>
              <p className="text-muted-foreground">
                Rediģējiet{' '}
                <code className="bg-muted px-2 py-1 rounded">src/App.tsx</code>{' '}
                un saglabājiet, lai redzētu izmaiņas.
              </p>
            </CardContent>
          </Card>

          {/* Latvian Character Test */}
          <LatvianTextTest />

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Projekta Informācija</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Tehnoloģijas</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• React 19</li>
                    <li>• TypeScript</li>
                    <li>• Vite</li>
                    <li>• Tailwind CSS v4</li>
                    <li>• shadcn/ui</li>
                    <li>• UTF-8 atbalsts</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Eksāmena Sekcijas
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">75%</Badge>
                      <span className="text-muted-foreground">
                        Valsts himna
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">7/10</Badge>
                      <span className="text-muted-foreground">
                        Vēstures jautājumi
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">5/8</Badge>
                      <span className="text-muted-foreground">
                        Konstitūcijas jautājumi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default App
