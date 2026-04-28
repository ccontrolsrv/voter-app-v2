/**
 * Componente de captura de imagem via câmera
 * Para ser usado no módulo de upload de procuração
 */

import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'

export default function CameraCapture({ onCapture, onCancel }) {
  const webcamRef = useRef(null)
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [facingMode, setFacingMode] = useState('environment') // 'user' (frontal) ou 'environment' (traseira)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImage(imageSrc)
    } else {
      setError('Não foi possível capturar a imagem. Tente novamente.')
    }
  }, [webcamRef])

  const retake = () => {
    setImage(null)
    setError('')
  }

  const confirmCapture = () => {
    if (image) {
      onCapture(image)
    }
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    setImage(null)
    setError('')
  }

  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!image ? (
        <>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={videoConstraints}
              className="w-full h-auto"
              onUserMediaError={() => setError('Não foi possível acessar a câmera. Verifique as permissões.')}
            />
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={capture} className="bg-blue-600 hover:bg-blue-700">
              📸 Tirar Foto
            </Button>
            <Button onClick={switchCamera} variant="outline">
              🔄 Trocar Câmera
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden border">
            <img src={image} alt="Pré-visualização" className="w-full h-auto" />
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={confirmCapture} className="bg-green-600 hover:bg-green-700">
              ✅ Usar esta imagem
            </Button>
            <Button onClick={retake} variant="outline">
              🔄 Tirar novamente
            </Button>
          </div>
        </>
      )}

      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <p className="text-xs text-gray-500 text-center">
            📌 Dicas:<br />
            • Posicione o documento em um local bem iluminado<br />
            • Mantenha o celular estável para uma imagem nítida<br />
            • A imagem será convertida para PDF automaticamente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}