/**
 * Statusi zahtjeva — odgovaraju ID-evima u tablici RequestStatus.
 *
 * Napomene o nazivlju:
 *  - Konstanta VRACENO (3) korisniku se prikazuje kao "Zahtjeva izmjene" —
 *    ta labela je kanonska (koristi je i klijent kao API filter vrijednost).
 *  - Status 4 (Odobreno) postoji u bazi kao stari zapis, ali se NE koristi
 *    u workflowu; "Naručeno" (6) je semantički ekvivalent.
 */
const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};

const STATUS_LABELS = {
  1: 'Poslano',
  2: 'Na odobrenju',
  3: 'Zahtjeva izmjene',
  4: 'Odobreno',
  5: 'Odbijeno',
  6: 'Naručeno',
  7: 'Zatvoreno',
};

// Zaključani statusi — zahtjev se više ne mijenja niti mu se diraju dokumenti.
const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];

module.exports = { STATUS, STATUS_LABELS, LOCKED_STATUSES };
