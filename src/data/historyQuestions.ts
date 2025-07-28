/**
 * @fileoverview Latvian History Knowledge Questions
 *
 * Comprehensive collection of Latvian history questions for the citizenship
 * naturalization exam. Questions cover key historical periods, events, and figures
 * from Latvia's founding through modern times.
 */

import type { Question } from '@/types/questions'

/**
 * Pool of history questions for the Latvian citizenship exam.
 * Minimum 20 questions required for proper randomization (10 selected per exam).
 */
export const HISTORY_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Kurā gadā Latvija proklamēja savu neatkarību?',
    options: [
      '1918. gada 18. novembrī',
      '1917. gada 18. novembrī',
      '1919. gada 18. novembrī',
    ],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Latvijas Neatkarības proklamēšana',
      tags: ['neatkarība', 'dibināšana', '1918'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 2,
    question: 'Kurš bija pirmais Latvijas valsts prezidents?',
    options: ['Jānis Čakste', 'Kārlis Ulmanis', 'Gustavs Zemgals'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Latvijas prezidenti',
      tags: ['prezidents', 'valsts vadītājs', 'čakste'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 3,
    question: 'Kurā gadā Latvija iestājās Eiropas Savienībā?',
    options: ['2004. gadā', '2003. gadā', '2005. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'ES paplašināšanās',
      tags: ['es', 'iestāšanās', '2004'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 4,
    question: 'Kurā gadā Latvija iestājās NATO?',
    options: ['2004. gadā', '2003. gadā', '2005. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'NATO paplašināšanās',
      tags: ['nato', 'drošība', '2004'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 5,
    question: 'Kurā gadā notika Barikāžu laiks Rīgā?',
    options: ['1991. gadā', '1990. gadā', '1989. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Atmodas periods',
      tags: ['barikādes', 'neatkarības atjaunošana', '1991'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 6,
    question:
      'Kurš bija Latvijas valsts dibinātājs un pirmais Ministru prezidents?',
    options: ['Kārlis Ulmanis', 'Jānis Čakste', 'Zigfrīds Anna Meierovics'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Latvijas dibināšana',
      tags: ['ulmanis', 'dibinātājs', 'ministru prezidents'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 7,
    question: 'Kurā gadā sākās Latvijas okupācija no Padomju Savienības puses?',
    options: ['1940. gadā', '1939. gadā', '1941. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Okupācijas periods',
      tags: ['okupācija', 'padomju savienība', '1940'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 8,
    question: 'Kurā gadā Latvija atjaunoja savu neatkarību?',
    options: [
      '1991. gada 21. augustā',
      '1990. gada 4. maijā',
      '1989. gada 23. augustā',
    ],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Neatkarības atjaunošana',
      tags: ['neatkarības atjaunošana', '1991', 'augusts'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 9,
    question: 'Kura dziesma tiek uzskatīta par Latvijas otro himnu?',
    options: ['"Pūt, vējiņi!"', '"Latvju dārzs"', '"Saule, Pērkons, Daugava"'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Kultūras mantojums',
      tags: ['kultūra', 'dziesma', 'himna'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 10,
    question: 'Kurā gadā tika izveidota Baltijas ceļš?',
    options: [
      '1989. gada 23. augustā',
      '1988. gada 23. augustā',
      '1990. gada 23. augustā',
    ],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Baltijas ceļš',
      tags: ['baltijas ceļš', 'protests', '1989'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 11,
    question:
      'Kurš bija Latvijas ārlietu ministrs, kas parakstīja Tautas Savienības uzņemšanas līgumu?',
    options: ['Zigfrīds Anna Meierovics', 'Kārlis Ulmanis', 'Jānis Čakste'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Starptautiskā atzīšana',
      tags: ['meierovics', 'tautas savienība', 'diplomātija'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 12,
    question: 'Kurā gadā Latvijā tika ieviests eiro?',
    options: [
      '2014. gada 1. janvārī',
      '2013. gada 1. janvārī',
      '2015. gada 1. janvārī',
    ],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Ekonomiskā integrācija',
      tags: ['eiro', 'valūta', '2014'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 13,
    question: 'Kura pilsēta bija Latvijas pirmā galvaspilsēta?',
    options: ['Rīga', 'Jelgava', 'Liepāja'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Administratīvā struktūra',
      tags: ['galvaspilsēta', 'rīga', 'pārvalde'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 14,
    question: 'Kurā periodā valdīja Kārļa Ulmaņa autoritārais režīms?',
    options: ['1934. - 1940. gadā', '1930. - 1940. gadā', '1936. - 1940. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Autoritārais periods',
      tags: ['ulmanis', 'autoritārisms', '1934-1940'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 15,
    question: 'Kurš bija pirmais Tautas frontes vadītājs?',
    options: ['Dainis Īvāns', 'Anatolijs Gorbunovs', 'Ivars Godmanis'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Atmodas periods',
      tags: ['tautas fronte', 'īvāns', 'atmoda'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 16,
    question:
      'Kurā gadā Latvija kļuva par Apvienoto Nāciju Organizācijas dalībvalsti?',
    options: ['1991. gadā', '1992. gadā', '1990. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Starptautiskā atzīšana',
      tags: ['ano', 'dalība', '1991'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 17,
    question: 'Kāds bija Molotova-Ribentropa pakta sekas Latvijai?',
    options: [
      'Latvija tika iekļauta PSRS interešu sfērā',
      'Latvija saņēma neatkarības garantijas',
      'Latvija kļuva par neitrālu valsti',
    ],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Otrais pasaules karš',
      tags: ['molotova-ribentropa pakts', 'okupācija', '1939'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 18,
    question: 'Kurš pants Latvijas Satversmē nosaka valsts valodu?',
    options: ['4. pants', '2. pants', '6. pants'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Satversme',
      tags: ['valsts valoda', 'satversme', 'latviešu valoda'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 19,
    question:
      'Kurā gadā tika atjaunota Latvijas pilsonība pēc neatkarības atgūšanas?',
    options: ['1991. gadā', '1992. gadā', '1990. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Pilsonības likumdošana',
      tags: ['pilsonība', 'atjaunošana', '1991'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 20,
    question:
      'Kurš no šiem notikumiem notika Latvijas neatkarības cīņu laikā (1918-1920)?',
    options: ['Bermonta uzbrukums Rīgai', 'Barikāžu laiks', 'Baltijas ceļš'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Neatkarības cīņas',
      tags: ['bermonts', 'neatkarības cīņas', '1919'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
  {
    id: 21,
    question: 'Kurā gadā Latvijā notika dziedošā revolūcija?',
    options: ['1987. - 1991. gadā', '1985. - 1989. gadā', '1989. - 1993. gadā'],
    correctAnswer: 0,
    category: 'history',
    metadata: {
      source: 'Atmodas periods',
      tags: ['dziedošā revolūcija', 'atmoda', 'kultūra'],
      lastUpdated: Date.now(),
      author: 'Latvian History',
    },
  },
]

/**
 * Validates the history question pool structure and content
 */
export function validateHistoryQuestionPool(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check minimum pool size
  if (HISTORY_QUESTIONS.length < 20) {
    errors.push(
      `Insufficient questions: ${HISTORY_QUESTIONS.length} (minimum 20 required)`
    )
  }

  // Validate each question
  const seenIds = new Set<number>()

  HISTORY_QUESTIONS.forEach((question, index) => {
    const questionNum = index + 1

    // Check for duplicate IDs
    if (seenIds.has(question.id)) {
      errors.push(`Question ${questionNum}: Duplicate ID ${question.id}`)
    }
    seenIds.add(question.id)

    // Validate question structure
    if (!question.id || typeof question.id !== 'number') {
      errors.push(`Question ${questionNum}: Invalid or missing ID`)
    }

    if (!question.question?.trim()) {
      errors.push(`Question ${questionNum}: Missing question text`)
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      errors.push(`Question ${questionNum}: Must have exactly 3 options`)
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      errors.push(`Question ${questionNum}: Invalid correct answer index`)
    }

    if (question.category !== 'history') {
      errors.push(
        `Question ${questionNum}: Expected category 'history', got '${question.category}'`
      )
    }

    // Check option quality
    if (question.options) {
      const emptyOptions = question.options.filter((opt) => !opt?.trim())
      if (emptyOptions.length > 0) {
        errors.push(`Question ${questionNum}: Contains empty answer options`)
      }

      // Check for duplicate options
      const uniqueOptions = new Set(
        question.options.map((opt) => opt.trim().toLowerCase())
      )
      if (uniqueOptions.size !== 3) {
        warnings.push(
          `Question ${questionNum}: Contains similar answer options`
        )
      }
    }

    // Validate metadata
    if (!question.metadata?.source) {
      warnings.push(`Question ${questionNum}: Missing metadata source`)
    }

    if (!question.metadata?.tags || question.metadata.tags.length === 0) {
      warnings.push(`Question ${questionNum}: Missing metadata tags`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get statistics about the history question pool
 */
export function getHistoryQuestionStats(): {
  totalQuestions: number
  categories: Record<string, number>
  averageOptionsLength: number
  questionWithLongestText: { id: number; length: number }
} {
  const categories: Record<string, number> = {}
  let totalOptionsLength = 0
  let questionWithLongestText = { id: 0, length: 0 }

  HISTORY_QUESTIONS.forEach((question) => {
    // Count by tags if available
    if (question.metadata?.tags) {
      question.metadata.tags.forEach((tag) => {
        categories[tag] = (categories[tag] || 0) + 1
      })
    }

    // Calculate options length
    const optionsLength = question.options.reduce(
      (sum, opt) => sum + opt.length,
      0
    )
    totalOptionsLength += optionsLength

    // Track longest question
    if (question.question.length > questionWithLongestText.length) {
      questionWithLongestText = {
        id: question.id,
        length: question.question.length,
      }
    }
  })

  return {
    totalQuestions: HISTORY_QUESTIONS.length,
    categories,
    averageOptionsLength: Math.round(
      totalOptionsLength / (HISTORY_QUESTIONS.length * 3)
    ),
    questionWithLongestText,
  }
}
