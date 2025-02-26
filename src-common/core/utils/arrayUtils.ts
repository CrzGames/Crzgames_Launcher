/**
 * Function to loop through the field object and retrieve a value with path
 * @template T
 * @param {T} item - object to loop through
 * @param {string} path - path to the value
 * @returns {string} - value of the path
 */
/*export default getValueWithPath = <T>(item: T, path: string): string => {
  let value: any = item
  const keys: string[] = path.split('.')
  for (const key of keys) {
    if (!value) {
      value = {}
    }
    value = value[key]
  }
  return value?.toString()
}*/
