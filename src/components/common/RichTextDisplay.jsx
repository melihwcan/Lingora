import { parseRichText } from '../../utils/richText'

export default function RichTextDisplay({ text }) {
  if (!text) return null
  const nodes = parseRichText(text)
  return <>{nodes}</>
}
