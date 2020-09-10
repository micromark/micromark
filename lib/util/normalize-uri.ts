export default function normalizeUri(url: string) {
  return encodeURI(decodeURI(url))
}
