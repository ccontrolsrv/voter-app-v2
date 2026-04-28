// frontend/src/modules/voting/VoterAssemblyOptions.jsx

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { getElectionResults } from '../../services/adminApi'
import { hasUserVotedInAssembly } from './votingService'
import ElectionResultsChart from '../admin/ElectionResultsChart'

export default function VoterAssemblyOptions({ 
  voter, 
  assembly, 
  votingWeight, 
  condominiumId, 
  onVote, 
  onBack 
}) {
  const [results, setResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [error, setError] = useState('')
  const [hasVoted, setHasVoted] = useState(false)
  const [checkingVote, setCheckingVote] = useState(true)

  // Verifica o status do voto diretamente no backend
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!assembly?.number || !condominiumId || !voter?.email) {
        setCheckingVote(false)
        return
      }
      
      try {
        const result = await hasUserVotedInAssembly(condominiumId, assembly.number, voter.email)
        console.log('Status do voto:', result)
        if (result.success) {
          setHasVoted(result.hasVoted)
        }
      } catch (err) {
        console.error('Erro ao verificar status do voto:', err)
      } finally {
        setCheckingVote(false)
      }
    }
    
    checkVoteStatus()
  }, [assembly?.number, condominiumId, voter?.email])

  // Logs para debug
  console.log('=== VoterAssemblyOptions ===')
  console.log('Assembly recebido:', assembly)
  console.log('Status da assembleia:', assembly?.status)
  console.log('hasVoted (buscado):', hasVoted)

  // Carrega resultados sempre que a assembleia mudar
  useEffect(() => {
    if (assembly?.number && condominiumId) {
      loadResults()
      
      const interval = setInterval(loadResults, 10000)
      return () => clearInterval(interval)
    }
  }, [assembly?.number, condominiumId])

  const loadResults = async () => {
    if (!assembly?.number) return
    
    setLoadingResults(true)
    setError('')
    
    try {
      const result = await getElectionResults(condominiumId, assembly.number)
      if (result.success) {
        setResults(result)
      } else {
        setError(result.error || 'Erro ao carregar resultados')
      }
    } catch (err) {
      setError('Erro ao carregar resultados')
    } finally {
      setLoadingResults(false)
    }
  }

  // Verifica se os dados da assembleia existem
  if (!assembly) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-red-500">Erro: Dados da assembleia não carregados.</p>
            <Button onClick={onBack} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determina se o votante pode votar
  const isActive = assembly.status === 'active'
  const canVote = isActive && !hasVoted && !checkingVote

  // Formata a data
  const formatDate = (dateStr) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  const assemblyDate = formatDate(assembly.date)

  if (checkingVote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar para login
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="text-5xl mb-3">🗳️</div>
            <CardTitle className="text-2xl">Sistema de Votação</CardTitle>
            <CardDescription>
              Olá, <strong>{voter?.name || 'Votante'}</strong>!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Informações da Assembleia */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span>📋</span> Assembleia
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {assembly.name}</p>
                <p><strong>Número:</strong> {assembly.number}</p>
                {assemblyDate && <p><strong>Data:</strong> {assemblyDate}</p>}
                <p>
                  <strong>Status:</strong> 
                  {isActive && <span className="ml-2 text-green-600 font-medium">🟢 VOTAÇÃO ABERTA</span>}
                  {!isActive && <span className="ml-2 text-gray-600 font-medium">🔴 VOTAÇÃO ENCERRADA</span>}
                </p>
                {hasVoted && (
                  <p className="text-yellow-600 text-sm mt-2">
                    ✅ Você já votou nesta assembleia
                  </p>
                )}
                <p className="pt-2">
                  <strong>Peso do Voto:</strong> 
                  <span className="ml-2 font-bold text-blue-600">{votingWeight}</span>
                  {votingWeight > 1 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (você representa {votingWeight} votos, incluindo {votingWeight - 1} procuração(ões))
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Botão de Votar - aparece apenas se puder votar */}
            {canVote && (
              <div className="space-y-1">
                <Button 
                  onClick={onVote} 
                  className="w-full py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  size="lg"
                >
                  🗳️ VOTAR NESTA ASSEMBLEIA
                </Button>
                <p className="text-xs text-center text-green-600">
                  ✅ Você pode votar agora! A votação está aberta.
                </p>
              </div>
            )}

            {hasVoted && (
              <div className="text-center py-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700 font-medium">
                  ✅ Você já votou nesta assembleia!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Seu voto já foi registrado. Os resultados são atualizados automaticamente.
                </p>
              </div>
            )}

            {!isActive && !hasVoted && (
              <div className="text-center py-3 bg-gray-100 rounded-lg">
                <p className="text-gray-600 font-medium">
                  ⏳ Votação encerrada
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  A votação foi encerrada pelo administrador. Confira os resultados abaixo.
                </p>
              </div>
            )}

            {/* Informativo da Assembleia */}
            {assembly.informative_text && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>📢</span> Informativo
                </h3>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{assembly.informative_text}</p>
              </div>
            )}

            {/* RESULTADOS - SEMPRE VISÍVEIS */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <span>📊</span> Resultados da Votação
                {!loadingResults && results && (
                  <span className="text-xs text-gray-400 ml-2">(atualizado automaticamente)</span>
                )}
              </h3>

              {loadingResults && !results && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">Carregando resultados...</span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {results && results.items_results && results.items_results.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-800">{results.total_eligible_voters}</div>
                      <div className="text-xs text-blue-600">Cadastrados para Votação direta</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">{results.total_votes_cast}</div>
                      <div className="text-xs text-green-600">Total de Votos - Inclui Procurações</div>
                    </div>
                  </div>

                  {results.items_results.map((item, idx) => (
                    <ElectionResultsChart key={item.item_id} item={item} itemNumber={idx + 1} />
                  ))}
                </div>
              ) : (
                !loadingResults && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum resultado disponível ainda.
                  </div>
                )
              )}
            </div>
            
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-400">
                Sistema de Votação Eletrônica - Voto seguro e auditável
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}