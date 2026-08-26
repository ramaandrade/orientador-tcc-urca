export interface PhoneSanitizationResult {
  isValid: boolean;
  raw: string;
  sanitized: string; // e.g. 5511988887777 (without @s.whatsapp.net)
  formatted: string; // e.g. +55 (11) 98888-7777
  jid: string;       // e.g. 5511988887777@s.whatsapp.net
  error?: string;
}

export function sanitizeBrazilianPhone(input: string | number | null | undefined): PhoneSanitizationResult {
  const raw = String(input || '').trim();
  if (!raw) {
    return {
      isValid: false,
      raw,
      sanitized: '',
      formatted: '',
      jid: '',
      error: 'Telefone vazio',
    };
  }

  // Remove non-digit characters
  let digits = raw.replace(/\D/g, '');

  // If leading zeros exists (e.g., 011988887777)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If starts with 55 (Brazil country code)
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2);
  }

  // DDD is first 2 digits
  if (digits.length < 10 || digits.length > 11) {
    return {
      isValid: false,
      raw,
      sanitized: '',
      formatted: raw,
      jid: '',
      error: `Quantidade de dígitos inválida (${digits.length} dígitos encontrados)`,
    };
  }

  const ddd = digits.substring(0, 2);
  let numberPart = digits.substring(2);

  // If 8 digits (missing 9th digit for mobile), prepend 9
  if (numberPart.length === 8) {
    numberPart = '9' + numberPart;
  }

  if (numberPart.length !== 9) {
    return {
      isValid: false,
      raw,
      sanitized: '',
      formatted: raw,
      jid: '',
      error: 'Número móvel deve ter 9 dígitos após o DDD',
    };
  }

  const fullClean = `55${ddd}${numberPart}`;
  const formatted = `+55 (${ddd}) ${numberPart.substring(0, 5)}-${numberPart.substring(5)}`;
  const jid = `${fullClean}@s.whatsapp.net`;

  return {
    isValid: true,
    raw,
    sanitized: fullClean,
    formatted,
    jid,
  };
}
