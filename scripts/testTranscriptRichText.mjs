import assert from 'node:assert/strict'
import {
  splitTranscriptLine,
  repairSplitMarkers,
  parseRichText,
  richTextToHtml,
  htmlToRichText,
} from '../src/utils/richText.js'

const WHOLE_LINE_BOLD =
  '**So Carolina, where did you first meet Enrico? | Peki Carolina, Enrico ile ilk nerede tanıştınız?**'

// Whole-line bold split across pipe → both segments bold
{
  const { english, turkish, hasTranslation } = splitTranscriptLine(WHOLE_LINE_BOLD)
  assert.equal(hasTranslation, true)
  assert.equal(english, '**So Carolina, where did you first meet Enrico?**')
  assert.equal(turkish, '**Peki Carolina, Enrico ile ilk nerede tanıştınız?**')
}

// Plain bilingual line unchanged
{
  const line = 'English | Turkish'
  const { english, turkish, hasTranslation } = splitTranscriptLine(line)
  assert.equal(hasTranslation, true)
  assert.equal(english, 'English')
  assert.equal(turkish, 'Turkish')
}

// Bold english only, plain turkish
{
  const line = '**bold english** | plain turkish'
  const { english, turkish } = splitTranscriptLine(line)
  assert.equal(english, '**bold english**')
  assert.equal(turkish, 'plain turkish')
}

// repairSplitMarkers orphan fix
{
  const repaired = repairSplitMarkers(
    '**So Carolina, where did you first meet Enrico?',
    'Peki Carolina, Enrico ile ilk nerede tanıştınız?**'
  )
  assert.equal(repaired.english, '**So Carolina, where did you first meet Enrico?**')
  assert.equal(repaired.turkish, '**Peki Carolina, Enrico ile ilk nerede tanıştınız?**')
}

// No translation pipe → single segment
{
  const { english, turkish, hasTranslation } = splitTranscriptLine('Just one line')
  assert.equal(hasTranslation, false)
  assert.equal(english, 'Just one line')
  assert.equal(turkish, null)
}

// Whole-line underline
{
  const line = '++English phrase | Türkçe ifade++'
  const { english, turkish } = splitTranscriptLine(line)
  assert.equal(english, '++English phrase++')
  assert.equal(turkish, '++Türkçe ifade++')
}

// Whole-line bold+italic split across pipe
{
  const line =
    '***So Carolina, where did you first meet Enrico? | Peki Carolina, Enrico ile ilk nerede tanıştınız?***'
  const { english, turkish, hasTranslation } = splitTranscriptLine(line)
  assert.equal(hasTranslation, true)
  assert.equal(english, '***So Carolina, where did you first meet Enrico?***')
  assert.equal(turkish, '***Peki Carolina, Enrico ile ilk nerede tanıştınız?***')
}

// repairSplitMarkers bold+italic orphan fix
{
  const repaired = repairSplitMarkers(
    '***So Carolina, where did you first meet Enrico?',
    'Peki Carolina, Enrico ile ilk nerede tanıştınız?***'
  )
  assert.equal(repaired.english, '***So Carolina, where did you first meet Enrico?***')
  assert.equal(repaired.turkish, '***Peki Carolina, Enrico ile ilk nerede tanıştınız?***')
}

// parseRichText: *** bold+italic ***
{
  const nodes = parseRichText('***So Carolina, where did you first meet Enrico?***')
  assert.equal(nodes.length, 1)
  assert.equal(nodes[0].type, 'strong')
  assert.equal(nodes[0].props.children.type, 'em')
  assert.equal(nodes[0].props.children.props.children, 'So Carolina, where did you first meet Enrico?')
}

// richTextToHtml round-trip for bold+italic
{
  const source = '***So Carolina, where did you first meet Enrico?***'
  const html = richTextToHtml(source)
  assert.equal(html, '<strong><em>So Carolina, where did you first meet Enrico?</em></strong>')
}

// htmlToRichText: nested strong+em → ***
{
  const TEXT_NODE = 3
  const ELEMENT_NODE = 1

  function el(tag, ...children) {
    return {
      nodeType: ELEMENT_NODE,
      tagName: tag.toUpperCase(),
      childNodes: children.flat(),
    }
  }

  function text(value) {
    return { nodeType: TEXT_NODE, textContent: value }
  }

  const root = el('div', el('strong', el('em', text('So Carolina, where did you first meet Enrico?'))))
  const serialized = htmlToRichText(root)
  assert.equal(serialized, '***So Carolina, where did you first meet Enrico?***')
}

// htmlToRichText: nested em+strong → ***
{
  const TEXT_NODE = 3
  const ELEMENT_NODE = 1

  function el(tag, ...children) {
    return {
      nodeType: ELEMENT_NODE,
      tagName: tag.toUpperCase(),
      childNodes: children.flat(),
    }
  }

  function text(value) {
    return { nodeType: TEXT_NODE, textContent: value }
  }

  const root = el('div', el('em', el('strong', text('bold italic'))))
  const serialized = htmlToRichText(root)
  assert.equal(serialized, '***bold italic***')
}

console.log('All transcript richText tests passed.')
