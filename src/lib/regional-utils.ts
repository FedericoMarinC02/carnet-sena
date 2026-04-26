function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const REGIONAL_BY_CENTER_KEYWORD: Array<[string, string]> = [
  ["caldas", "Regional Caldas"],
  ["antioquia", "Regional Antioquia"],
  ["medellin", "Regional Antioquia"],
  ["bogota", "Regional Distrito Capital"],
  ["distrito capital", "Regional Distrito Capital"],
  ["cundinamarca", "Regional Cundinamarca"],
  ["valle", "Regional Valle"],
  ["cali", "Regional Valle"],
  ["atlantico", "Regional Atlantico"],
  ["barranquilla", "Regional Atlantico"],
  ["bolivar", "Regional Bolivar"],
  ["cartagena", "Regional Bolivar"],
  ["boyaca", "Regional Boyaca"],
  ["cauca", "Regional Cauca"],
  ["cesar", "Regional Cesar"],
  ["cordoba", "Regional Cordoba"],
  ["huila", "Regional Huila"],
  ["magdalena", "Regional Magdalena"],
  ["meta", "Regional Meta"],
  ["narino", "Regional Narino"],
  ["norte de santander", "Regional Norte de Santander"],
  ["quindio", "Regional Quindio"],
  ["risaralda", "Regional Risaralda"],
  ["santander", "Regional Santander"],
  ["tolima", "Regional Tolima"],
];

export function getRegionalFromCentro(centro: string | null): string | null {
  if (!centro?.trim()) return null;
  const normalized = normalizeText(centro);

  for (const [keyword, regional] of REGIONAL_BY_CENTER_KEYWORD) {
    if (normalized.includes(keyword)) return regional;
  }

  return null;
}
