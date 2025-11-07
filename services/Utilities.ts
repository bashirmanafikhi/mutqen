

export const toArabicNumber = (num: number): string => {
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().split('').map(d => arabicDigits[parseInt(d)]).join('');
};