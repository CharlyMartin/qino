/**
 * Splits a header value at each `separator` outside a quoted string, as RFC
 * 9110 quotes parameter values: inside quotes, a separator is data, and `\`
 * escapes the character after it.
 */
export function splitUnquoted(value: string, separator: string) {
  const parts: Array<string> = [];
  let part = "";
  let isQuoted = false;
  for (let index = 0; index < value.length; index++) {
    const char = value.charAt(index);
    if (char == separator && !isQuoted) {
      parts.push(part);
      part = "";
      continue;
    }
    part += char;
    if (char == '"') isQuoted = !isQuoted;
    // An escaped character, a quote included, can't end the quoted string.
    else if (char == "\\" && isQuoted) part += value.charAt(++index);
  }
  parts.push(part);
  return parts;
}
