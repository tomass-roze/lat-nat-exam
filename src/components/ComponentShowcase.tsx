import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export function ComponentShowcase() {
  const [progress, setProgress] = useState(65)
  const [radioValue, setRadioValue] = useState('option1')

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        shadcn/ui Components Showcase
      </h1>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Various button styles and states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Inputs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
          <CardDescription>Input fields and form controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sample-input">Sample Input</Label>
              <Input id="sample-input" placeholder="Enter text..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disabled-input">Disabled Input</Label>
              <Input id="disabled-input" placeholder="Disabled" disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sample-textarea">Sample Textarea</Label>
            <Textarea id="sample-textarea" placeholder="Enter longer text..." />
          </div>

          <div className="space-y-3">
            <Label>Radio Group</Label>
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="option1" />
                <Label htmlFor="option1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="option2" />
                <Label htmlFor="option2">Option 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="option3" />
                <Label htmlFor="option3">Option 3</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Indicator</CardTitle>
          <CardDescription>Progress bars and completion status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Progress: {progress}%</Label>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10
                </Button>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-latvian-red text-white">Latvian Red</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This is an informational alert with default styling.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            This is an error alert indicating something went wrong.
          </AlertDescription>
        </Alert>

        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            This is a success alert with custom styling.
          </AlertDescription>
        </Alert>
      </div>

      {/* Latvian Character Test */}
      <Card>
        <CardHeader>
          <CardTitle>Latvian Character Support</CardTitle>
          <CardDescription>
            Testing UTF-8 support for Latvian diacritics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Latvian Text Sample</Label>
            <Input
              placeholder="Mācīties latviešu valodu..."
              defaultValue="Ābece: ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž"
            />
          </div>
          <Badge variant="outline">Latvijas Republika 🇱🇻</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComponentShowcase
