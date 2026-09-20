import * as pdfjsLib from 'pdfjs-dist'

// Configure worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  } catch (e) {
    // Fallback CDN if bundler worker resolution fails
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  }
}

/**
 * Extracts plain text from a PDF File or ArrayBuffer.
 * Works entirely client-side in the browser.
 */
export async function extractTextFromPdf(fileOrBuffer) {
  try {
    let arrayBuffer
    if (fileOrBuffer instanceof ArrayBuffer) {
      arrayBuffer = fileOrBuffer
    } else if (fileOrBuffer?.arrayBuffer) {
      arrayBuffer = await fileOrBuffer.arrayBuffer()
    } else {
      return ''
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const maxPages = Math.min(pdf.numPages, 15)
    let fullText = ''

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ')
      fullText += `\n--- Page ${pageNum} ---\n` + pageText
    }

    return fullText.trim()
  } catch (err) {
    console.warn('[PDF Extractor] Error extracting text from PDF:', err)
    return ''
  }
}
