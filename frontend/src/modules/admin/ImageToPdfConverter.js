/**
 * Utilitário para converter imagem em PDF
 */

import html2pdf from 'html2pdf.js'

/**
 * Converte uma imagem (Blob ou URL) para PDF
 * @param {string|Blob} imageSource - URL da imagem ou Blob
 * @param {string} filename - Nome do arquivo PDF
 * @returns {Promise<File>} - Arquivo PDF
 */
export async function convertImageToPdf(imageSource, filename = 'procuracao.pdf') {
  return new Promise((resolve, reject) => {
    // Criar elemento img para carregar a imagem
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    
    img.onload = () => {
      // Criar canvas para redimensionar/processar a imagem
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Configurar dimensões A4 (proporção)
      const maxWidth = 800
      const maxHeight = 1100
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      // Converter para Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Erro ao processar imagem'))
          return
        }
        
        // Criar URL para o Blob
        const url = URL.createObjectURL(blob)
        
        // Criar elemento div temporário para gerar PDF
        const element = document.createElement('div')
        element.style.padding = '20px'
        element.style.backgroundColor = 'white'
        element.style.textAlign = 'center'
        
        const imgElement = document.createElement('img')
        imgElement.src = url
        imgElement.style.maxWidth = '100%'
        imgElement.style.height = 'auto'
        element.appendChild(imgElement)
        
        // Adicionar informações da procuração
        const infoDiv = document.createElement('div')
        infoDiv.style.marginTop = '20px'
        infoDiv.style.fontFamily = 'Arial, sans-serif'
        infoDiv.style.fontSize = '10px'
        infoDiv.style.color = '#666'
        infoDiv.style.textAlign = 'center'
        infoDiv.innerHTML = `
          <p>Documento gerado automaticamente pelo Sistema de Votação Eletrônica</p>
          <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
        `
        element.appendChild(infoDiv)
        
        // Usar html2pdf para converter
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }
        
        try {
          // @ts-ignore - html2pdf não tem tipos
          const html2pdfLib = await import('html2pdf.js')
          const pdfBlob = await html2pdfLib.default().set(opt).from(element).outputPdf('blob')
          
          // Limpar URL
          URL.revokeObjectURL(url)
          
          // Criar arquivo PDF
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })
          resolve(pdfFile)
        } catch (err) {
          reject(err)
        }
      }, 'image/jpeg', 0.9)
    }
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'))
    }
    
    if (typeof imageSource === 'string') {
      img.src = imageSource
    } else {
      const url = URL.createObjectURL(imageSource)
      img.src = url
      img.onload = () => {
        URL.revokeObjectURL(url)
      }
    }
  })
}

/**
 * Converte uma imagem Blob para PDF (versão simplificada)
 */
export async function imageBlobToPdf(blob, filename = 'procuracao.pdf') {
  return convertImageToPdf(blob, filename)
}