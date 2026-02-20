

export const trimToMax = (value: string | number, max: number) =>
  typeof value == 'string' && value.length > max ? `${value.slice(0, max - 1)}…` : value