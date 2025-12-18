import type { ImageSourcePropType } from "react-native"

export type RuleType = {
  number: string
  text: string | React.ReactNode
  image?: ImageSourcePropType
  imageDescription?: string
}

export type TopicType = {
  title: string
  rules: RuleType[]
}

export type RulesDataType = Record<number, TopicType>

export interface QuizQuestion {
  id: string;
  question: string;
  questionType?: string;
  questionImageUrl?: string;
  imageHeight: number;
  openEndedAnswer?: string;
  options: string[];
  answers: string[];
  hint?: string;
  points: number;
  position: number;
  hintImageUrl?: string;
  note?: string;
  likes: number;
  dislikes: number;
  quizId: string;
}

export interface Question {
  id: string;
  question: string;
  questionType?: string;
  imageHeight: number;
  questionImageUrl?: string | null;
  options: string[];
  answers: string[];
  explanation?: string;
  hint?: string;
  hintImageUrl?: string;
  isSaved: boolean;
  isLiked: boolean;
  isDisliked: boolean;
  likes: number;
  dislikes: number;
}
