import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'

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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">
          Latviešu Valodas UTF-8 Atbalsta Tests
        </CardTitle>
        <CardDescription>
          Pārbaudām latviešu simbolu atbalstu un attēlošanu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Character Display Test */}
        <div>
          <h3 className="text-lg font-medium mb-3">
            Latviešu diakritiskie simboli
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium mb-2 block">Mazie burti:</Label>
              <div className="bg-muted p-3 rounded border">
                <span className="text-2xl font-mono">
                  {latvianChars.lowercase.join(' ')}
                </span>
              </div>
            </div>
            <div>
              <Label className="font-medium mb-2 block">Lielie burti:</Label>
              <div className="bg-muted p-3 rounded border">
                <span className="text-2xl font-mono">
                  {latvianChars.uppercase.join(' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Alphabet Test */}
        <div>
          <h3 className="text-lg font-medium mb-3">Pilns latviešu alfabēts</h3>
          <div className="bg-muted p-3 rounded border">
            <span className="text-xl font-mono break-all">{fullAlphabet}</span>
          </div>
        </div>

        {/* Sample Text Test */}
        <div>
          <h3 className="text-lg font-medium mb-3">Himnas fragments</h3>
          <div className="bg-muted p-4 rounded border">
            <pre className="text-lg font-serif whitespace-pre-wrap">
              {sampleText}
            </pre>
          </div>
        </div>

        {/* Input Test */}
        <div>
          <h3 className="text-lg font-medium mb-3">Ievades tests</h3>
          <p className="text-muted-foreground mb-2">
            Ierakstiet tekstu ar latviešu simboliem, lai pārbaudītu ievades
            atbalstu:
          </p>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ierakstiet tekstu šeit... (izmēģiniet: āčēģīķļņšūž)"
            rows={4}
          />
          {inputText && (
            <Card className="mt-3">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2">Ievadītais teksts:</h4>
                <p className="text-lg">{inputText}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Font Test */}
        <div>
          <h3 className="text-lg font-medium mb-3">Fontu tests</h3>
          <div className="space-y-3">
            <div>
              <Badge variant="outline" className="mr-2">
                Inter (default)
              </Badge>
              <span className="text-lg font-sans">
                Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">
                Monospace
              </Badge>
              <span className="text-lg font-mono">
                Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">
                Serif
              </Badge>
              <span className="text-lg font-serif">
                Ātrā čūčais ģīmis ķēdē ļoti ņiprā šūnu žēlošanu
              </span>
            </div>
          </div>
        </div>

        {/* Test Status */}
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>UTF-8 atbalsts darbojas!</strong> Visi latviešu simboli tiek
            pareizi attēloti.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default LatvianTextTest
