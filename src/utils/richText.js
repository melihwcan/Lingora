import { createElement } from 'react'

const TEXT_NODE = 3
const ELEMENT_NODE = 1

const MARKERS = [
  { open: '***', close: '***', isBoldItalic: true },
  { open: '**', close: '**', tag: 'strong' },
  { open: '++', close: '++', tag: 'u' },
  { open: '*', close: '*', tag: 'em', isItalic: true },
]

const TRANSCRIPT_PIPE = ' | '

const SPLIT_MARKERS = [
  { open: '***', close: '***' },
  { open: '**', close: '**' },
  { open: '++', close: '++' },
  { open: '*', close: '*', isItalic: true },
]

function findEarliestOpen(text, from) {
  let earliest = null

  for (let i = from; i < text.length; i++) {
    for (const marker of MARKERS) {
      if (marker.isBoldItalic) {
        if (!text.startsWith('***', i)) continue
      } else if (marker.open === '**') {
        if (!text.startsWith('**', i)) continue
        if (text.startsWith('***', i)) continue
      } else if (marker.isItalic) {
        if (text[i] !== '*') continue
        if (text[i + 1] === '*') continue
        if (i > 0 && text[i - 1] === '*') continue
      } else if (!text.startsWith(marker.open, i)) {
        continue
      }

      if (!earliest || i < earliest.index) {
        earliest = { ...marker, index: i }
      }
      break
    }
  }

  return earliest
}

function findClose(text, marker, openIndex) {
  const start = openIndex + marker.open.length

  if (marker.isBoldItalic) {
    for (let i = start; i <= text.length - 3; i++) {
      if (text.startsWith('***', i)) return i
    }
    return -1
  }

  if (marker.isItalic) {
    for (let i = start; i < text.length; i++) {
      if (text[i] !== '*') continue
      if (text[i + 1] === '*') {
        i++
        continue
      }
      if (text[i - 1] === '*') continue
      return i
    }
    return -1
  }

  for (let i = start; i <= text.length - marker.close.length; i++) {
    if (marker.open === '**' && text.startsWith('***', i)) continue
    if (text.startsWith(marker.close, i)) return i
  }
  return -1
}

function wrapBoldItalic(children, keyPrefix, key) {
  const content =
    children.length === 1 && typeof children[0] === 'string' ? children[0] : children
  return createElement(
    'strong',
    { key: `${keyPrefix}-${key}` },
    createElement('em', { key: `${keyPrefix}-${key}-em` }, content)
  )
}

function tokenize(text, keyPrefix = 'rt') {
  const nodes = []
  let pos = 0
  let key = 0

  while (pos < text.length) {
    const open = findEarliestOpen(text, pos)

    if (!open) {
      nodes.push(text.slice(pos))
      break
    }

    if (open.index > pos) {
      nodes.push(text.slice(pos, open.index))
    }

    const closeIndex = findClose(text, open, open.index)

    if (closeIndex === -1) {
      nodes.push(text.slice(pos, open.index + open.open.length))
      pos = open.index + open.open.length
      continue
    }

    const inner = text.slice(open.index + open.open.length, closeIndex)
    const children = tokenize(inner, `${keyPrefix}-${key}`)

    if (open.isBoldItalic) {
      nodes.push(wrapBoldItalic(children, keyPrefix, key++))
    } else {
      nodes.push(
        createElement(
          open.tag,
          { key: `${keyPrefix}-${key++}` },
          children.length === 1 && typeof children[0] === 'string' ? children[0] : children
        )
      )
    }

    pos = closeIndex + open.close.length
  }

  return nodes
}

/**
 * Parse marker syntax into React nodes: ***bold+italic***, **bold**, *italic*, ++underline++
 */
export function parseRichText(text) {
  if (!text) return []
  return tokenize(text)
}

function markerIsBalancedAtEdges(text, marker) {
  if (!text.startsWith(marker.open) || !text.endsWith(marker.close)) return false
  const closeIndex = findClose(text, marker, 0)
  return closeIndex !== -1 && closeIndex + marker.close.length === text.length
}

function markerSpansPipe(text, marker) {
  if (!markerIsBalancedAtEdges(text, marker)) return false
  const inner = text.slice(marker.open.length, text.length - marker.close.length)
  return inner.includes(TRANSCRIPT_PIPE)
}

function shouldSkipSplitRepair(marker, english, turkish) {
  if (marker.open === '**') {
    return english.startsWith('***') || turkish.endsWith('***')
  }
  if (marker.isItalic) {
    return (
      english.startsWith('**') ||
      turkish.endsWith('**') ||
      english.startsWith('***') ||
      turkish.endsWith('***')
    )
  }
  return false
}

/**
 * Repair formatting markers split across English | Turkish pipe boundary.
 * e.g. `**English` + `Turkish**` → `**English**` + `**Turkish**`
 */
export function repairSplitMarkers(english, turkish) {
  let en = english
  let tr = turkish

  for (const marker of SPLIT_MARKERS) {
    if (!en.startsWith(marker.open) || !tr.endsWith(marker.close)) continue
    if (shouldSkipSplitRepair(marker, en, tr)) continue
    if (markerIsBalancedAtEdges(en, marker)) continue

    en = en.slice(marker.open.length)
    tr = tr.slice(0, -marker.close.length)
    en = `${marker.open}${en}${marker.close}`
    tr = `${marker.open}${tr}${marker.close}`
  }

  return { english: en, turkish: tr }
}

/**
 * Split a bilingual transcript line on ` | ` while preserving whole-line formatting.
 */
export function splitTranscriptLine(line) {
  const pipeIndex = line.indexOf(TRANSCRIPT_PIPE)
  if (pipeIndex === -1) {
    return { english: line, turkish: null, hasTranslation: false }
  }

  for (const marker of SPLIT_MARKERS) {
    if (!markerSpansPipe(line, marker)) continue

    const inner = line.slice(marker.open.length, line.length - marker.close.length)
    const innerPipe = inner.indexOf(TRANSCRIPT_PIPE)

    const en = inner.slice(0, innerPipe)
    const tr = inner.slice(innerPipe + TRANSCRIPT_PIPE.length)
    return {
      english: `${marker.open}${en}${marker.close}`,
      turkish: `${marker.open}${tr}${marker.close}`,
      hasTranslation: true,
    }
  }

  const parts = line.split(TRANSCRIPT_PIPE)
  const english = parts[0]
  const turkish = parts.slice(1).join(TRANSCRIPT_PIPE)
  return { ...repairSplitMarkers(english, turkish), hasTranslation: true }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function tokenizeLineToHtml(text) {
  const parts = []
  let pos = 0

  while (pos < text.length) {
    const open = findEarliestOpen(text, pos)

    if (!open) {
      parts.push(escapeHtml(text.slice(pos)))
      break
    }

    if (open.index > pos) {
      parts.push(escapeHtml(text.slice(pos, open.index)))
    }

    const closeIndex = findClose(text, open, open.index)

    if (closeIndex === -1) {
      parts.push(escapeHtml(text.slice(pos, open.index + open.open.length)))
      pos = open.index + open.open.length
      continue
    }

    const inner = text.slice(open.index + open.open.length, closeIndex)
    if (open.isBoldItalic) {
      parts.push(`<strong><em>${tokenizeLineToHtml(inner)}</em></strong>`)
    } else {
      parts.push(`<${open.tag}>${tokenizeLineToHtml(inner)}</${open.tag}>`)
    }
    pos = closeIndex + open.close.length
  }

  return parts.join('')
}

/** Convert marker syntax to HTML for contenteditable initial content. */
export function richTextToHtml(text) {
  if (!text) return ''
  return text.split('\n').map(tokenizeLineToHtml).join('<br>')
}

function serializeBoldItalicInner(inner) {
  if (inner.includes(TRANSCRIPT_PIPE)) {
    return inner.split(TRANSCRIPT_PIPE).map((part) => `***${part}***`).join(TRANSCRIPT_PIPE)
  }
  return `***${inner}***`
}

function serializeFormattedInner(tag, inner) {
  const wrappers = {
    strong: ['**', '**'],
    b: ['**', '**'],
    em: ['*', '*'],
    i: ['*', '*'],
    u: ['++', '++'],
  }
  const pair = wrappers[tag]
  if (!pair) return inner

  const [open, close] = pair
  if (inner.includes(TRANSCRIPT_PIPE)) {
    return inner.split(TRANSCRIPT_PIPE).map((part) => `${open}${part}${close}`).join(TRANSCRIPT_PIPE)
  }
  return `${open}${inner}${close}`
}

function isElement(node) {
  return node.nodeType === ELEMENT_NODE
}

function nestedBoldItalic(node) {
  if (!isElement(node)) return null

  const tag = node.tagName.toLowerCase()
  const elementChildren = Array.from(node.childNodes).filter(isElement)
  if (elementChildren.length !== 1) return null

  const outer = tag
  const innerTag = elementChildren[0].tagName.toLowerCase()
  const pairs = [
    ['strong', 'em'],
    ['strong', 'i'],
    ['b', 'em'],
    ['b', 'i'],
    ['em', 'strong'],
    ['em', 'b'],
    ['i', 'strong'],
    ['i', 'b'],
  ]

  for (const [a, b] of pairs) {
    if (outer === a && innerTag === b) {
      const contentNode = elementChildren[0]
      const inner = Array.from(contentNode.childNodes).map(serializeInline).join('')
      return serializeBoldItalicInner(inner)
    }
  }

  return null
}

function serializeInline(node) {
  if (node.nodeType === TEXT_NODE) return node.textContent
  if (node.nodeType !== ELEMENT_NODE) return ''

  const boldItalic = nestedBoldItalic(node)
  if (boldItalic !== null) return boldItalic

  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return '\n'

  const inner = Array.from(node.childNodes).map(serializeInline).join('')

  if (tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i' || tag === 'u') {
    return serializeFormattedInner(tag, inner)
  }
  return inner
}

const FORMAT_TAGS = new Set(['strong', 'b', 'em', 'i', 'u'])

function isInsideFormattedElement(node, root) {
  let parent = node.parentElement
  while (parent && parent !== root) {
    if (FORMAT_TAGS.has(parent.tagName.toLowerCase())) return true
    parent = parent.parentElement
  }
  return false
}

function plainTextHasCompleteMarkers(text) {
  let pos = 0
  while (pos < text.length) {
    const open = findEarliestOpen(text, pos)
    if (!open) return false
    const closeIndex = findClose(text, open, open.index)
    if (closeIndex !== -1) return true
    pos = open.index + open.open.length
  }
  return false
}

function createFormattedElement(doc, open, inner) {
  const innerFrag = buildFormattedFragment(inner, doc).fragment
  if (open.isBoldItalic) {
    const strong = doc.createElement('strong')
    const em = doc.createElement('em')
    while (innerFrag.firstChild) em.appendChild(innerFrag.firstChild)
    strong.appendChild(em)
    return strong
  }
  const el = doc.createElement(open.tag)
  while (innerFrag.firstChild) el.appendChild(innerFrag.firstChild)
  return el
}

/**
 * Parse plain-text marker syntax into a DOM fragment for contenteditable auto-format.
 */
function buildFormattedFragment(text, doc, cursorOffset = null) {
  const fragment = doc.createDocumentFragment()
  let pos = 0
  let cursorPlacement = null
  let hasConversion = false

  while (pos < text.length) {
    const open = findEarliestOpen(text, pos)

    if (!open) {
      const plain = text.slice(pos)
      const tn = doc.createTextNode(plain)
      fragment.appendChild(tn)
      if (cursorOffset !== null && cursorOffset >= pos && cursorOffset <= pos + plain.length) {
        cursorPlacement = { node: tn, offset: cursorOffset - pos }
      }
      break
    }

    if (open.index > pos) {
      const plain = text.slice(pos, open.index)
      const tn = doc.createTextNode(plain)
      fragment.appendChild(tn)
      if (cursorOffset !== null && cursorOffset >= pos && cursorOffset <= open.index) {
        cursorPlacement = { node: tn, offset: cursorOffset - pos }
      }
    }

    const closeIndex = findClose(text, open, open.index)

    if (closeIndex === -1) {
      const rest = text.slice(open.index)
      const tn = doc.createTextNode(rest)
      fragment.appendChild(tn)
      if (cursorOffset !== null && cursorOffset >= open.index && cursorOffset <= open.index + rest.length) {
        cursorPlacement = { node: tn, offset: cursorOffset - open.index }
      }
      break
    }

    hasConversion = true
    const markerEnd = closeIndex + open.close.length
    const inner = text.slice(open.index + open.open.length, closeIndex)
    const formattedEl = createFormattedElement(doc, open, inner)
    fragment.appendChild(formattedEl)

    if (cursorOffset !== null && cursorOffset >= open.index && cursorOffset <= markerEnd) {
      if (cursorOffset >= markerEnd) {
        cursorPlacement = { afterNode: formattedEl }
      } else if (cursorOffset <= open.index + open.open.length) {
        cursorPlacement = { beforeNode: formattedEl }
      } else {
        cursorPlacement = { afterNode: formattedEl }
      }
    }

    pos = markerEnd
  }

  return { fragment, cursorPlacement, hasConversion }
}

function applyCursorPlacement(doc, cursorPlacement) {
  if (!cursorPlacement) return
  const sel = window.getSelection()
  if (!sel) return

  const range = doc.createRange()
  if (cursorPlacement.afterNode) {
    range.setStartAfter(cursorPlacement.afterNode)
  } else if (cursorPlacement.beforeNode) {
    range.setStartBefore(cursorPlacement.beforeNode)
  } else if (cursorPlacement.node) {
    range.setStart(cursorPlacement.node, cursorPlacement.offset)
  } else {
    return
  }
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 * Convert complete marker pairs in plain text nodes to formatting elements.
 * Returns true when the DOM was modified.
 */
export function autoFormatContentEditable(root) {
  if (!root) return false

  const doc = root.ownerDocument
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent) return NodeFilter.FILTER_REJECT
      if (isInsideFormattedElement(node, root)) return NodeFilter.FILTER_REJECT
      if (!plainTextHasCompleteMarkers(node.textContent)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes = []
  let node = walker.nextNode()
  while (node) {
    textNodes.push(node)
    node = walker.nextNode()
  }

  if (!textNodes.length) return false

  const sel = window.getSelection()
  const activeNode =
    sel && sel.rangeCount > 0 && root.contains(sel.getRangeAt(0).startContainer)
      ? sel.getRangeAt(0).startContainer
      : null
  const activeOffset = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).startOffset : null

  let modified = false
  let cursorPlacement = null

  for (const textNode of textNodes) {
    if (!textNode.parentNode) continue

    const cursorOffset = activeNode === textNode ? activeOffset : null

    const { fragment, cursorPlacement: placement, hasConversion } = buildFormattedFragment(
      textNode.textContent,
      doc,
      cursorOffset
    )

    if (!hasConversion) continue

    textNode.parentNode.insertBefore(fragment, textNode)
    textNode.parentNode.removeChild(textNode)
    modified = true

    if (placement) cursorPlacement = placement
  }

  if (modified) applyCursorPlacement(doc, cursorPlacement)
  return modified
}

/** Walk contenteditable DOM and convert formatting tags back to marker syntax. */
export function htmlToRichText(root) {
  const parts = []

  for (const child of root.childNodes) {
    if (child.nodeType === ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'div' || tag === 'p') {
        if (parts.length > 0) parts.push('\n')
        parts.push(serializeInline(child))
        continue
      }
    }
    parts.push(serializeInline(child))
  }

  return parts.join('')
}

/**
 * Wrap the current textarea selection with formatting markers.
 * Returns new value and selection range for cursor restoration.
 */
export function wrapSelection(textarea, { prefix, suffix }) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.slice(start, end)

  const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
  const cursorStart = start + prefix.length
  const cursorEnd = cursorStart + selected.length

  return {
    value: newValue,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd,
  }
}
