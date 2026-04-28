/**
 * Módulo 1 - Upload de Procuração
 * Duas opções:
 * 1. Upload de arquivo PDF do computador
 * 2. Tirar foto com a câmera e converter para PDF
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { createProxy } from '../../services/adminApi'
import { uploadProxyFile } from '../../services/storageService'
import CameraCapture from './CameraCapture'
import { convertImageToPdf } from './ImageToPdfConverter'

export default function UploadProxy({ onSuccess }) {
  const { condId } = useParams()
  const [activeTab, setActiveTab] = useState('file')
  
  // Estado para formulário
  const [grantorCpf, setGrantorCpf] = useState('')
  const [granteeEmail, setGranteeEmail] = useState('')
  const [granteeName, setGranteeName] = useState('')
  const [file, setFile] = useState(null)
  const [cameraImage, setCameraImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setFile(null)
      setError('Por favor, selecione um arquivo PDF válido')
    }
  }

  const handleCameraCapture = async (imageDataUrl) => {
    setUploading(true)
    setError('')
    
    try {
      // Converter imagem para PDF
      const pdfFile = await convertImageToPdf(imageDataUrl, `procuracao_${grantorCpf}_${Date.now()}.pdf`)
      setCameraImage(pdfFile)
      setShowCamera(false)
      setSuccess('Imagem capturada e convertida para PDF com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao converter imagem para PDF: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const cpfDigits = grantorCpf.replace(/\D/g, '')
    
    if (cpfDigits.length !== 11) {
      setError('CPF do outorgante deve ter 11 dígitos')
      return
    }
    
    if (!granteeEmail.trim()) {
      setError('Email do outorgado é obrigatório')
      return
    }
    
    if (!granteeName.trim()) {
      setError('Nome do outorgado é obrigatório')
      return
    }
    
    // Verificar qual arquivo usar
    const fileToUpload = activeTab === 'file' ? file : cameraImage
    
    if (!fileToUpload) {
      setError(activeTab === 'file' ? 'Selecione um arquivo PDF' : 'Tire uma foto da procuração')
      return
    }
    
    setUploading(true)
    setError('')
    setSuccess('')
    
    try {
      // 1. Upload PDF/Imagem para Firebase Storage
      const pdfUrl = await uploadProxyFile(condId, fileToUpload, grantorCpf)
      
      // 2. Create proxy record in Firestore
      const result = await createProxy(condId, {
        grantor_cpf: cpfDigits,
        grantee_email: granteeEmail,
        grantee_name: granteeName,
        pdf_url: pdfUrl
      })
      
      if (result.success) {
        setSuccess(`Procuração cadastrada com sucesso!`)
        setGrantorCpf('')
        setGranteeEmail('')
        setGranteeName('')
        setFile(null)
        setCameraImage(null)  
      const pdfFileInput = document.getElementById('pdf-file')
      if (pdfFileInput) {
        pdfFileInput.value = ''
      }
        if (onSuccess) onSuccess()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Procuração</CardTitle>
        <CardDescription>
          Preencha os dados e anexe a procuração (PDF ou foto via câmera).
          O outorgante (quem dá a procuração) não poderá votar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">📄 Upload PDF</TabsTrigger>
            <TabsTrigger value="camera">📸 Foto via Câmera</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos do formulário (mesmo código existente) */}
              <div className="space-y-2">
                <Label>CPF do Outorgante *</Label>
                <Input
                  value={grantorCpf}
                  onChange={(e) => setGrantorCpf(formatCpf(e.target.value))}
                  placeholder="123.456.789-00"
                  maxLength={14}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email do Outorgado *</Label>
                <Input
                  type="email"
                  value={granteeEmail}
                  onChange={(e) => setGranteeEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Nome do Outorgado *</Label>
                <Input
                  value={granteeName}
                  onChange={(e) => setGranteeName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Arquivo PDF *</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required={activeTab === 'file' && !file}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Cadastrar Procuração'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="camera">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>CPF do Outorgante *</Label>
                <Input
                  value={grantorCpf}
                  onChange={(e) => setGrantorCpf(formatCpf(e.target.value))}
                  placeholder="123.456.789-00"
                  maxLength={14}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email do Outorgado *</Label>
                <Input
                  type="email"
                  value={granteeEmail}
                  onChange={(e) => setGranteeEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Nome do Outorgado *</Label>
                <Input
                  value={granteeName}
                  onChange={(e) => setGranteeName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              {!cameraImage ? (
                <>
                  {!showCamera ? (
                    <Button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      📸 Abrir Câmera
                    </Button>
                  ) : (
                    <CameraCapture
                      onCapture={handleCameraCapture}
                      onCancel={() => setShowCamera(false)}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-green-700 text-sm">
                      ✅ Imagem capturada e convertida para PDF!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Arquivo pronto para envio
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setCameraImage(null)}
                    variant="outline"
                    className="w-full"
                  >
                    🔄 Tirar nova foto
                  </Button>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={uploading || (!cameraImage && !showCamera)}
              >
                {uploading ? 'Enviando...' : 'Cadastrar Procuração'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4 bg-green-50 border-green-500">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}