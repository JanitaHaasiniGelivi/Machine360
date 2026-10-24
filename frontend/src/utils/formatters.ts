// Industrial Conversion and Formatting Utilities

export function kelvinToCelsius(k: number): number {
  return Math.round((k - 273.15) * 10) / 10;
}

export function celsiusToKelvin(c: number): number {
  return Math.round((c + 273.15) * 10) / 10;
}

export function formatWatts(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${watts.toFixed(0)} W`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}
