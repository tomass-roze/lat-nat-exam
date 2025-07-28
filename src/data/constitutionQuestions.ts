/**
 * @fileoverview Latvian Constitution Knowledge Questions
 *
 * Comprehensive collection of constitutional law questions for the Latvian citizenship
 * naturalization exam. Questions cover fundamental constitutional principles, rights,
 * government structure, and legislative processes as defined in the Latvijas Republikas Satversme.
 */

import type { Question } from '@/types/questions'

/**
 * Pool of constitutional law questions for the Latvian citizenship exam.
 * Minimum 16 questions required for proper randomization (8 selected per exam).
 */
export const CONSTITUTION_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Kad tika pieņemta spēkā esošā Latvijas Republikas Satversme?',
    options: [
      '1922. gada 15. februārī',
      '1921. gada 15. februārī',
      '1920. gada 15. februārī',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, pieņemšanas datums',
      tags: ['vēsture', 'satversme', 'dibināšana'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 2,
    question: 'Kurš ir Latvijas valsts prezidents pēc Satversmes?',
    options: ['Valsts galva', 'Valdības vadītājs', 'Saeimas priekšsēdētājs'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 35. pants',
      tags: ['prezidents', 'valsts galva', 'vara'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 3,
    question: 'Cik deputātu ir Saeimā?',
    options: ['100 deputāti', '120 deputāti', '80 deputāti'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 5. pants',
      tags: ['saeima', 'deputāti', 'likumdošana'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 4,
    question: 'Uz cik gadiem tiek ievēlēts Latvijas Valsts prezidents?',
    options: ['4 gadiem', '5 gadiem', '6 gadiem'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 35. pants',
      tags: ['prezidents', 'pilnvaru termiņš', 'vēlēšanas'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 5,
    question: 'Kas ir augstākā izpildvaras institūcija Latvijā?',
    options: ['Ministru kabinets', 'Valsts prezidents', 'Saeimas prezidijs'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 55. pants',
      tags: ['izpildvara', 'ministru kabinets', 'valdība'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 6,
    question: 'Kurš ieceļ un atceļ ministrus?',
    options: ['Ministru prezidents', 'Valsts prezidents', 'Saeima'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 56. pants',
      tags: ['ministri', 'ministru prezidents', 'iecelšana'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 7,
    question: 'Kas ir Latvijas augstākā tiesas institūcija?',
    options: ['Augstākā tiesa', 'Satversmes tiesa', 'Administratīvā tiesa'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 82. pants',
      tags: ['tiesu vara', 'augstākā tiesa', 'tiesības'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 8,
    question:
      'Kāda ir minimālā vecuma prasība, lai kļūtu par Saeimas deputātu?',
    options: ['21 gads', '18 gadi', '25 gadi'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 7. pants',
      tags: ['saeima', 'deputāti', 'vecuma prasības'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 9,
    question: 'Uz cik gadiem tiek ievēlēta Saeima?',
    options: ['4 gadiem', '3 gadiem', '5 gadiem'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 10. pants',
      tags: ['saeima', 'pilnvaru termiņš', 'vēlēšanas'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 10,
    question: 'Kas pēc Satversmes ir Latvijas valsts valoda?',
    options: [
      'Latviešu valoda',
      'Latviešu un krievu valoda',
      'Latviešu, krievu un vācu valoda',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 4. pants',
      tags: ['valsts valoda', 'latviešu valoda', 'valoda'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 11,
    question: 'Kurš var izsludināt referendumu par Saeimas atlaišanu?',
    options: [
      'Valsts prezidents',
      'Ministru prezidents',
      'Saeimas priekšsēdētājs',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 48. pants',
      tags: ['referendums', 'saeimas atlaišana', 'prezidents'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 12,
    question: 'Kas ir Latvijas valsts ģerbonis?',
    options: [
      'Sarkans lauva ar sudrabainu vairogu',
      'Balts ērglis uz zila fona',
      'Zelta saule uz zaļa fona',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, valsts simboli',
      tags: ['valsts simboli', 'ģerbonis', 'latvijas simboli'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 13,
    question: 'Kas ir Latvijas pilsoņu pamattiesība pēc Satversmes?',
    options: [
      'Vienlīdzība likuma priekšā',
      'Bezmaksas izglītība',
      'Garantēta darbavieta',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 91. pants',
      tags: ['pamattiesības', 'vienlīdzība', 'tiesības'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 14,
    question: 'Kurš apstiprina valsts budžetu?',
    options: ['Saeima', 'Ministru kabinets', 'Finanšu ministrs'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 11. pants',
      tags: ['budžets', 'saeima', 'finanses'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 15,
    question: 'Kāda ir maksimālā vecuma robeža Valsts prezidentam?',
    options: ['Nav vecuma ierobežojuma', '70 gadi', '75 gadi'],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 35. pants',
      tags: ['prezidents', 'vecuma prasības', 'ierobežojumi'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 16,
    question: 'Kas notiek, ja Valsts prezidents nevar pildīt savus pienākumus?',
    options: [
      'Viņa pienākumus pilda Saeimas priekšsēdētājs',
      'Tiek izsludinātas ārkārtas vēlēšanas',
      'Pienākumus pilda ministru prezidents',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 53. pants',
      tags: ['prezidents', 'pilnvaru nodošana', 'saeimas priekšsēdētājs'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 17,
    question: 'Kāda ir Satversmes tiesas galvenā funkcija?',
    options: [
      'Pārbaudīt likumu atbilstību Satversmei',
      'Tiesāt krimināllietas',
      'Risināt civilstrīdus',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversmes tiesas likums',
      tags: ['satversmes tiesa', 'likumu kontrole', 'satversme'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 18,
    question: 'Kas var ierosināt Satversmes grozījumus?',
    options: [
      'Ne mazāk kā trešdaļa Saeimas deputātu',
      'Tikai Valsts prezidents',
      'Tikai Ministru kabinets',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 76. pants',
      tags: ['satversmes grozījumi', 'likumdošanas process', 'deputāti'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 19,
    question: 'Kāda ir minimālā dalībnieku skaita prasība referendumam?',
    options: [
      'Puse no iepriekšējo Saeimas vēlēšanu dalībnieku skaita',
      'Trešdaļa no visiem vēlētājiem',
      'Divas trešdaļas no visiem vēlētājiem',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 77. pants',
      tags: ['referendums', 'dalībnieku skaits', 'demokrātija'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
  {
    id: 20,
    question: 'Kas ir nepieciešams, lai kļūtu par Latvijas Valsts prezidentu?',
    options: [
      'Latvijas pilsonība un 40 gadu vecums',
      'Dzimšana Latvijā un 35 gadu vecums',
      '10 gadu dzīvošana Latvijā un 45 gadu vecums',
    ],
    correctAnswer: 0,
    category: 'constitution',
    metadata: {
      source: 'Satversme, 36. pants',
      tags: ['prezidents', 'pilsonība', 'vecuma prasības'],
      lastUpdated: Date.now(),
      author: 'Latvian Constitution',
    },
  },
]

/**
 * Validates that the question pool meets minimum requirements
 */
export function validateConstitutionQuestionPool(): {
  isValid: boolean
  errors: string[]
  questionCount: number
} {
  const errors: string[] = []
  const questionCount = CONSTITUTION_QUESTIONS.length

  if (questionCount < 16) {
    errors.push(
      `Insufficient questions: ${questionCount} (minimum 16 required)`
    )
  }

  // Check for duplicate IDs
  const ids = CONSTITUTION_QUESTIONS.map((q) => q.id)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate question IDs found: ${duplicateIds.join(', ')}`)
  }

  // Validate each question structure
  CONSTITUTION_QUESTIONS.forEach((question, index) => {
    if (!question.question?.trim()) {
      errors.push(`Question ${index + 1}: Missing question text`)
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      errors.push(`Question ${index + 1}: Must have exactly 3 options`)
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      errors.push(`Question ${index + 1}: Invalid correct answer index`)
    }

    if (question.category !== 'constitution') {
      errors.push(`Question ${index + 1}: Must have category 'constitution'`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    questionCount,
  }
}
