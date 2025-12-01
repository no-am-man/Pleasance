export type Language = {
  value: string;
  label: string;
};

export const LANGUAGES: Language[] = [
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Aramaic', label: 'Aramaic' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'English', label: 'English' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Hebrew', label: 'Hebrew' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Vulgar Latin', label: 'Vulgar Latin' },
  { value: 'Yiddish', label: 'Yiddish' },
];

export type Voice = {
  value: string;
  label: string;
}

export const VOICES: Voice[] = [
    { value: 'Algenib', label: 'Algenib (Female)' },
    { value: 'Achernar', label: 'Achernar (Male)' },
    { value: 'Enif', label: 'Enif (Female)' },
    { value: 'Hadar', label: 'Hadar (Male)' },
    { value: 'Mirzam', label: 'Mirzam (Female)' },
    { value: 'Sirius', label: 'Sirius (Male)' },
];
