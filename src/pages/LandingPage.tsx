/**
 * @fileoverview Test selection landing page for flexible exam configuration
 *
 * Allows users to select which exam sections they want to take (anthem, history, constitution)
 * in any combination, then proceed to a customized exam experience.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, Target } from 'lucide-react'
import { SECTION_METADATA } from '@/types/constants'
import { MainLayout } from '@/components/layout/MainLayout'

/**
 * Section selection card component
 */
interface SectionCardProps {
  sectionId: string
  metadata: typeof SECTION_METADATA[keyof typeof SECTION_METADATA]
  isSelected: boolean
  onToggle: (sectionId: string) => void
}

function SectionCard({ sectionId, metadata, isSelected, onToggle }: SectionCardProps) {
  const handleClick = () => {
    onToggle(sectionId)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle(sectionId)
    }
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-primary border-primary bg-primary/5' 
          : 'hover:border-primary/50'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="checkbox"
      aria-checked={isSelected}
      aria-labelledby={`section-${sectionId}-title`}
      aria-describedby={`section-${sectionId}-description`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={metadata.title}>
              {metadata.icon}
            </span>
            <div>
              <CardTitle 
                id={`section-${sectionId}-title`}
                className="text-lg flex items-center gap-2"
              >
                {metadata.title}
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Izvēlēts" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" aria-label="Nav izvēlēts" />
                )}
              </CardTitle>
            </div>
          </div>
        </div>
        <CardDescription 
          id={`section-${sectionId}-description`}
          className="text-sm text-muted-foreground mt-2"
        >
          {metadata.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>Nepieciešams: {metadata.passingCriteria}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Aptuvens laiks: {metadata.estimatedTime} min</span>
          </div>
          
          <Badge 
            variant={isSelected ? "default" : "secondary"}
            className="w-fit"
          >
            {isSelected ? 'Izvēlēts' : 'Klikšķiniet, lai izvēlētos'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main landing page component
 */
export default function LandingPage() {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const handleSectionToggle = (sectionId: string) => {
    const newSelection = new Set(selectedSections)
    if (newSelection.has(sectionId)) {
      newSelection.delete(sectionId)
    } else {
      newSelection.add(sectionId)
    }
    setSelectedSections(newSelection)
  }

  const handleStartTest = () => {
    const sections = Array.from(selectedSections)
    navigate('/test', { 
      state: { 
        selectedSections: sections,
        isPartialTest: sections.length < 3 
      } 
    })
  }

  const totalEstimatedTime = Array.from(selectedSections).reduce((total, sectionId) => {
    return total + SECTION_METADATA[sectionId as keyof typeof SECTION_METADATA].estimatedTime
  }, 0)

  const sectionArray = Object.entries(SECTION_METADATA).sort(([,a], [,b]) => a.order - b.order)

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Latvijas pilsonības eksāmens
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Izvēlieties eksāmena sadaļas, kuras vēlaties kārtot. Jūs varat izvēlēties jebkuru kombināciju - 
            vienu, divas vai visas trīs sadaļas.
          </p>
        </div>

        {/* Section Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {sectionArray.map(([sectionId, metadata]) => (
            <SectionCard
              key={sectionId}
              sectionId={sectionId}
              metadata={metadata}
              isSelected={selectedSections.has(sectionId)}
              onToggle={handleSectionToggle}
            />
          ))}
        </div>

        {/* Selection Summary */}
        {selectedSections.size > 0 && (
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Izvēlētās sadaļas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Sadaļas ({selectedSections.size}):</h3>
                <ul className="space-y-1 text-sm">
                  {Array.from(selectedSections).map(sectionId => {
                    const metadata = SECTION_METADATA[sectionId as keyof typeof SECTION_METADATA]
                    return (
                      <li key={sectionId} className="flex items-center gap-2">
                        <span>{metadata.icon}</span>
                        <span>{metadata.title}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Kopējā informācija:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Aptuvens laiks: {totalEstimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>
                      {selectedSections.size === 3 
                        ? 'Pilns eksāmens' 
                        : `Daļējs eksāmens (${selectedSections.size} no 3)`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleStartTest}
            disabled={selectedSections.size === 0}
            size="lg"
            className="px-8"
          >
            {selectedSections.size === 0 
              ? 'Izvēlieties vismaz vienu sadaļu' 
              : `Sākt eksāmenu (${selectedSections.size} sadaļa${selectedSections.size === 1 ? '' : 's'})`
            }
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSelectedSections(new Set(['anthem', 'history', 'constitution']))}
            size="lg"
            className="px-8"
          >
            Izvēlēties visas sadaļas
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Jūs varat kārtot sadaļas atsevišķi, lai fokusētos uz specifiskām jomām vai 
            praktikotos pirms pilna eksāmena.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}