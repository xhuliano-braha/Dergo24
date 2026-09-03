const supportedCities = [
  'Tiranë', 'Durrës', 'Shkodër', 'Vlorë', 'Elbasan', 'Fier', 'Korçë', 'Berat',
  'Lushnjë', 'Pogradec', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës',
  'Peshkopi', 'Krujë', 'Laç', 'Patos', 'Librazhd', 'Kuçovë', 'Burrel', 'Cërrik',
  'Gramsh', 'Bulqizë', 'Përmet', 'Ballsh', 'Rrëshen', 'Tepelenë', 'Ersekë',
  'Peqin', 'Bajram Curri', 'Divjakë', 'Himarë', 'Pukë', 'Maliq', 'Roskovec',
  'Belsh', 'Fushë-Arrëz', 'Konispol', 'Koplik', 'Memaliaj', 'Poliçan', 'Delvinë',
  'Vorë', 'Kamëz', 'Selenicë', 'Orikum', 'Shijak', 'Ura Vajgurore', 'Rrogozhinë',
];

function fold(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function validateAlbanianAddress(city: string, address: string) {
  const matchedCity = supportedCities.find((item) => fold(item) === fold(city.trim()));
  const normalizedAddress = address.trim().replace(/\s+/g, ' ');
  const addressValid = normalizedAddress.length >= 5 && normalizedAddress.split(' ').length >= 2;
  return {
    valid: Boolean(matchedCity && addressValid),
    city: matchedCity ?? city.trim(),
    address: normalizedAddress,
    message: !matchedCity
      ? 'Qyteti nuk është në zonën aktuale të shërbimit.'
      : !addressValid
        ? 'Shkruani rrugën dhe një detaj orientues ose numrin.'
        : 'Adresa është gati për rezervim.',
  };
}

export { supportedCities };
