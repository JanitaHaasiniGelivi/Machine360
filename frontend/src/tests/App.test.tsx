import { describe, it, expect } from 'vitest';
import { kelvinToCelsius, celsiusToKelvin, formatWatts, formatCurrency } from '../utils/formatters';

describe('Formatters and Conversion Calculations', () => {
  it('converts Kelvin to Celsius accurately', () => {
    expect(kelvinToCelsius(273.15)).toBe(0.0);
    expect(kelvinToCelsius(298.15)).toBe(25.0);
    expect(kelvinToCelsius(308.6)).toBe(35.5);
  });

  it('converts Celsius to Kelvin accurately', () => {
    expect(celsiusToKelvin(0.0)).toBe(273.2);
    expect(celsiusToKelvin(25.0)).toBe(298.2);
  });

  it('formats mechanical Watts and Kilowatts', () => {
    expect(formatWatts(500)).toBe('500 W');
    expect(formatWatts(4500)).toBe('4.50 kW');
    expect(formatWatts(9250.7)).toBe('9.25 kW');
  });

  it('formats currency correctly', () => {
    expect(formatCurrency(1500)).toBe('$1,500');
    expect(formatCurrency(24500)).toBe('$24,500');
  });
});

describe('Physical Calculations Verification', () => {
  it('calculates derived mechanical power accurately according to physics formula', () => {
    // Formula: Power = Torque [Nm] * 2 * pi * RPM / 60
    const torque = 42.8;
    const rpm = 1551;
    const power = (torque * 2 * Math.PI * rpm) / 60;
    expect(Math.round(power)).toBe(6952);
  });

  it('calculates process minus air temperature delta', () => {
    const air = 298.1;
    const proc = 308.6;
    expect(Math.round((proc - air) * 10) / 10).toBe(10.5);
  });
});
