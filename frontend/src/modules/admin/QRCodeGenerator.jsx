/**
 * Módulo Admin - Gerador de QR Code
 * Permite ao administrador gerar QR Codes para URLs personalizadas
 * Útil para votantes acessarem rapidamente a página de votação
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeGenerator() {
  const [url, setUrl] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // URLs padrão para facilitar o uso
  const defaultUrls = [
    { label: 'Página Inicial da Votação', url: 'https://voter-app-v2.web.app/vote' },
    { label: 'Seleção de Condomínio', url: 'https://voter-app-v2.web.app/vote' },
    { label: 'Área Administrativa', url: 'https://voter-app-v2.web.app/Admin' },
  ]

  const handleGenerate = (e) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Digite uma URL válida')
      return
    }
    
    // Validação básica de URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('A URL deve começar com http:// ou https://')
      return
    }
    
    setError('')
    setSuccess('QR Code gerado com sucesso!')
    setGeneratedUrl(url)
    
    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleUseDefault = (defaultUrl) => {
    setUrl(defaultUrl)
    setGeneratedUrl('')
    setError('')
    setSuccess('')
  }

  const downloadQRCode = () => {
    const canvas = document.getElementById('qrcode-canvas')
    if (!canvas) return
    
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream')
    
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `qrcode_${new Date().getTime()}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const qrCodeSvg = document.getElementById('qrcode-svg')
    if (!qrCodeSvg) return
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${generatedUrl}</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
            }
            .url {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${qrCodeSvg.outerHTML}
            <div class="url">${generatedUrl}</div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">📱 Gerador de QR Code</h2>
        <p className="text-gray-500 mt-1">
          Gere QR Codes para facilitar o acesso dos votantes à plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de entrada */}
        <Card>
          <CardHeader>
            <CardTitle>Digite a URL</CardTitle>
            <CardDescription>
              Insira a URL que será convertida em QR Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 border-green-500">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://voter-app-v2.web.app/vote"
                />
              </div>
              
              <Button type="submit" className="w-full">
                Gerar QR Code
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* URLs sugeridas */}
        <Card>
          <CardHeader>
            <CardTitle>URLs Rápidas</CardTitle>
            <CardDescription>
              Clique em uma URL para usá-la automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {defaultUrls.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleUseDefault(item.url)}
              >
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[250px]">
                    {item.url}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Usar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* QR Code gerado */}
      {generatedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code Gerado</CardTitle>
            <CardDescription>
              Escaneie o código abaixo com a câmera do celular para acessar a URL
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg inline-block">
              <QRCodeSVG
                id="qrcode-svg"
                value={generatedUrl}
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              {/* Canvas oculto para download (necessário para PNG) */}
              <QRCodeSVG
                id="qrcode-canvas"
                value={generatedUrl}
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2 break-all">
                {generatedUrl}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={downloadQRCode} variant="outline">
                  📥 Baixar PNG
                </Button>
                <Button onClick={printQRCode} variant="outline">
                  🖨️ Imprimir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções de uso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📖 Como usar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
            <li>Digite a URL desejada no campo acima</li>
            <li>Clique em "Gerar QR Code"</li>
            <li>Use as URLs rápidas para acessar as páginas principais do sistema</li>
            <li>Baixe o QR Code em PNG para imprimir ou compartilhar</li>
            <li>Votantes podem escanear o código com a câmera do celular</li>
            <li>O QR Code redirecionará diretamente para a página de votação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}