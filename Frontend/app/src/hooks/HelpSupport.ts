export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ContactOption {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}