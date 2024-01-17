interface numberEnumType {
  [key: string]: string | number
}

export const numberEnumToArray = (numberEnum: numberEnumType) => {
  return Object.values(numberEnum).filter((item) => typeof item === 'number') as number[]
}
