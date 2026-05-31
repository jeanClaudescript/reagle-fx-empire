import { PDFParse } from 'pdf-parse'
import JSZip from 'jszip'
import type { BookFileType } from '../types/education.js'

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractFromEpub(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const container = await zip.file('META-INF/container.xml')?.async('string')
  if (!container) throw new Error('Invalid EPUB: missing container.xml')

  const opfMatch = container.match(/full-path="([^"]+\.opf)"/i)
  const opfPath = opfMatch?.[1]
  if (!opfPath) throw new Error('Invalid EPUB: cannot find OPF path')

  const opf = await zip.file(opfPath)?.async('string')
  if (!opf) throw new Error('Invalid EPUB: missing OPF file')

  const hrefs: string[] = []
  const itemRegex = /<itemref[^>]+idref="([^"]+)"/gi
  const idToHref = new Map<string, string>()
  const itemDefRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = itemDefRegex.exec(opf)) !== null) {
    idToHref.set(m[1], m[2])
  }
  while ((m = itemRegex.exec(opf)) !== null) {
    const href = idToHref.get(m[1])
    if (href) hrefs.push(href)
  }

  const opfDir = opfPath.includes('/') ? opfPath.replace(/\/[^/]+$/, '/') : ''
  const parts: string[] = []

  for (const href of hrefs) {
    const path = opfDir + href
    const html = await zip.file(path)?.async('string')
    if (html) {
      const text = stripHtml(html)
      if (text.length > 40) parts.push(text)
    }
  }

  if (!parts.length) throw new Error('EPUB contains no readable text')
  return parts.join('\n\n')
}

export async function extractBookText(buffer: Buffer, fileType: BookFileType) {
  if (fileType === 'txt') {
    const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').trim()
    if (!text) throw new Error('Text file is empty')
    return text
  }

  if (fileType === 'pdf') {
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      const text = result.text?.replace(/\s+/g, ' ').trim()
      if (!text || text.length < 50) throw new Error('PDF contains too little extractable text')
      return text
    } finally {
      await parser.destroy()
    }
  }

  if (fileType === 'epub') {
    return extractFromEpub(buffer)
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

export function detectFileType(mimeType: string, fileName: string): BookFileType | null {
  const lower = fileName.toLowerCase()
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf'
  if (mimeType === 'text/plain' || lower.endsWith('.txt')) return 'txt'
  if (mimeType === 'application/epub+zip' || lower.endsWith('.epub')) return 'epub'
  return null
}

export async function fetchBookBuffer(fileUrl: string) {
  const res = await fetch(fileUrl)
  if (!res.ok) throw new Error(`Failed to download book file (${res.status})`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
