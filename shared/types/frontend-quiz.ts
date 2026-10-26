export interface Question {
  question: string
  options: string[]
  answer: string
}

export interface FrontendQuiz {
  title: string
  icon: string
  questions: Question[]
}

export interface FrontendQuizResponse {
  success: boolean
  data: FrontendQuiz[]
}
