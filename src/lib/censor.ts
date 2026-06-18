// Список слов для замены взят по наиболее распространённым случаям
const BAD_WORDS: string[] = [
  // русский мат — корни, охватывают большинство форм
  'хуй', 'хую', 'хуя', 'хуе', 'хуём', 'хуев',
  'пизда', 'пизды', 'пизде', 'пизду', 'пиздец', 'пиздёж', 'пиздат',
  'ёбан', 'ебан', 'ебат', 'ёбат', 'еблан', 'заеба', 'наеба', 'выеба', 'отъеба', 'переёб',
  'блядь', 'блять', 'бляди', 'блядск', 'блядун',
  'сука', 'суки', 'суке', 'суку',
  'мудак', 'мудила', 'мудозвон',
  'залупа', 'залупин',
  'манда', 'мандавош',
  'долбоёб', 'долбоеб',
  'пиздёж',
  'ёбт', 'ёб твою',
  'пиздобол',
  'шлюха', 'шлюхи',
  'ублюдок', 'ублюдк',
  'уёбок', 'уёбищ',
  // английский
  'fuck', 'fuk', 'fck',
  'shit', 'sh1t',
  'bitch', 'b1tch',
  'cunt',
  'nigger', 'nigga',
  'faggot', 'fag',
  'whore',
  'slut',
  'asshole', 'a55hole',
  'bastard',
  'dickhead', 'dickface',
  'motherfuck',
  'cocksucker',
];

// регулярки строим один раз
const PATTERNS = BAD_WORDS.map(w => ({
  re: new RegExp(w, 'gi'),
  stars: '*'.repeat(w.length),
}));

export function censorText(text: string): string {
  let out = text;
  for (const { re, stars } of PATTERNS) {
    out = out.replace(re, stars);
  }
  return out;
}
