import { Injectable } from '@angular/core';

type Nullable<T> = T | null | undefined;

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  /* =========================================================
     Helpers internos
     ========================================================= */

  /** Convierte a string seguro (sin romper) */
  private toStr(value: Nullable<unknown>): string {
    return value === null || value === undefined ? '' : String(value);
  }

  /** Extrae solo dígitos (útil para máscaras, teléfonos, etc.) */
  private digits(value: Nullable<unknown>): string {
    return this.toStr(value).replace(/\D/g, '');
  }

  /** Verifica si un valor es número finito */
  private isFiniteNumber(n: unknown): n is number {
    return typeof n === 'number' && Number.isFinite(n);
  }

  /* =========================================================
     1) Requerido / Longitudes
     ========================================================= */

  /**
   * required:
   * - Strings: no vacío ni espacios
   * - Números: acepta 0 como válido
   * - Boolean: acepta false como válido (si existe)
   * - Arrays: length > 0
   * - Objetos: no null
   */
  public required(input: Nullable<unknown>): boolean {
    if (input === null || input === undefined) return false;

    if (typeof input === 'string') return input.trim().length > 0;

    if (typeof input === 'number') return Number.isFinite(input);

    if (typeof input === 'boolean') return true; // existe (true/false)

    if (Array.isArray(input)) return input.length > 0;

    // objeto / fecha / etc.
    return true;
  }

  /** Longitud máxima (para strings). */
  public maxLen(input: Nullable<unknown>, size: number): boolean {
    const s = this.toStr(input).trim();
    return s.length <= size;
  }

  /** Longitud mínima (para strings). */
  public minLen(input: Nullable<unknown>, size: number): boolean {
    const s = this.toStr(input).trim();
    return s.length >= size;
  }

  /** Rango de longitud (para strings). */
  public lenBetween(input: Nullable<unknown>, min: number, max: number): boolean {
    const s = this.toStr(input).trim();
    return s.length >= min && s.length <= max;
  }

  /* =========================================================
     2) Email
     ========================================================= */

  /**
   * Email (validación práctica, no “RFC completa”)
   * - Debe tener 1 @
   * - Dominio con punto y TLD de >=2
   * - Sin espacios
   */
  public email(input: Nullable<unknown>): boolean {
    const s = this.toStr(input).trim();
    if (!s) return false;

    // Evita match, regresa boolean
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(s);
  }

  /* =========================================================
     3) Números
     ========================================================= */

  /**
   * numeric:
   * Acepta números y strings numéricos
   * Ej: "10", "10.5", "-3"
   */
  public numeric(input: Nullable<unknown>): boolean {
    if (input === null || input === undefined) return false;
    if (this.isFiniteNumber(input)) return true;

    const s = this.toStr(input).trim();
    if (!s) return false;

    // Solo número (entero o decimal), con signo opcional
    return /^-?\d+(\.\d+)?$/.test(s);
  }

  /** Entero */
  public integer(input: Nullable<unknown>): boolean {
    if (input === null || input === undefined) return false;
    if (Number.isInteger(input)) return true;

    const s = this.toStr(input).trim();
    return /^-?\d+$/.test(s);
  }

  /** Rango numérico (corrige bug de su between) */
  public betweenNumber(input: Nullable<unknown>, min: number, max: number): boolean {
    if (!this.numeric(input)) return false;
    const n = Number(this.toStr(input));
    return n >= min && n <= max;
  }

  /** Máximo de decimales */
  public maxDecimals(input: Nullable<unknown>, size: number): boolean {
    const s = this.toStr(input).trim();
    if (!s) return false;

    // Si no es numérico, false
    if (!this.numeric(s)) return false;

    const parts = s.split('.');
    const decimals = parts[1]?.length ?? 0;
    return decimals <= size;
  }

  /** Mínimo de decimales */
  public minDecimals(input: Nullable<unknown>, size: number): boolean {
    const s = this.toStr(input).trim();
    if (!s) return false;

    if (!this.numeric(s)) return false;

    const parts = s.split('.');
    const decimals = parts[1]?.length ?? 0;
    return decimals >= size;
  }

  /* =========================================================
     4) Fechas
     ========================================================= */

  /**
   * dateISO:
   * Valida estrictamente "YYYY-MM-DD"
   * y que sea fecha real (no 2026-02-31)
   */
  public dateISO(input: Nullable<unknown>): boolean {
    const s = this.toStr(input).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;

    // Verifica que no “corrigió” la fecha (ej 2026-02-31 -> marzo)
    const [y, m, day] = s.split('-').map(Number);
    return d.getFullYear() === y && (d.getMonth() + 1) === m && d.getDate() === day;
  }

  /**
   * dateBetweenISO:
   * Rango inclusivo para fechas ISO
   */
  public dateBetweenISO(input: Nullable<unknown>, minISO: string, maxISO: string): boolean {
    if (!this.dateISO(input) || !this.dateISO(minISO) || !this.dateISO(maxISO)) return false;

    const val = new Date(`${this.toStr(input)}T00:00:00`).getTime();
    const min = new Date(`${minISO}T00:00:00`).getTime();
    const max = new Date(`${maxISO}T00:00:00`).getTime();

    return val >= min && val <= max;
  }

  /* =========================================================
     5) Texto (palabras, etc.)
     ========================================================= */

  /**
   * wordsES:
   * Letras + espacios + acentos + ñ + ü
   * Permite apóstrofe simple y guion si lo desea.
   */
  public wordsES(input: Nullable<unknown>, options?: { allowHyphen?: boolean; allowApostrophe?: boolean }): boolean {
    const s = this.toStr(input).trim();
    if (!s) return false;

    const allowHyphen = options?.allowHyphen ?? true;
    const allowApostrophe = options?.allowApostrophe ?? true;

    // Letras unicode + espacios, con opcional - y '
    // \p{L} requiere soporte Unicode (sí funciona en TS/JS modernos)
    const extra = `${allowHyphen ? '\\-' : ''}${allowApostrophe ? "'" : ''}`;
    const re = new RegExp(`^[\\p{L}\\s${extra}]+$`, 'u');

    return re.test(s);
  }

  /* =========================================================
     6) Teléfono (útil para su registro con máscara)
     ========================================================= */

  /**
   * phoneMX:
   * Valida 10 dígitos (México estándar)
   * Acepta entrada con máscara "(222) 123-4567"
   */
  public phoneMX(input: Nullable<unknown>): boolean {
    const d = this.digits(input);
    return d.length === 10;
  }

  /* =========================================================
     7) Utilidad: match personalizado
     ========================================================= */
  public regex(input: Nullable<unknown>, pattern: RegExp): boolean {
    const s = this.toStr(input);
    return pattern.test(s);
  }
}
