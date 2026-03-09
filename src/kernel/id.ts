const ID_PAD = 3;

export function makeId(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(ID_PAD, "0")}`;
}
