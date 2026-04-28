/**
 * Tabela detalhada de votos por item
 * Exibe cada votante, seu voto, apartamento e peso do voto
 * Destaca a opção vencedora em cada item
 * Inclui botão para exportar resultados em PDF
 */

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { ChevronDown, ChevronUp, Trophy, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ElectionResultsTable({ votesByItem, assemblyInfo }) {
  const [expandedItems, setExpandedItems] = useState({})
  const tableRef = useRef(null)

  const toggleItemExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const getVoteLabel = (voteValue, itemType, options = []) => {
    if (itemType === 'approve_reject') {
      return voteValue === 'approve' ? '✅ Aprovar' : '❌ Reprovar'
    }
    const option = options.find(opt => opt.id === voteValue || opt.id === voteValue)
    return option ? option.label : voteValue
  }

  const getVoteClass = (voteValue, itemType) => {
    if (itemType === 'approve_reject') {
      return voteValue === 'approve' 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }
    return 'bg-blue-100 text-blue-700'
  }

  // Encontra a opção vencedora para um item
  const getWinningOption = (item) => {
    if (!item.vote_counts || Object.keys(item.vote_counts).length === 0) {
      return null
    }
    
    let winningOption = null
    let maxWeight = -1
    
    for (const [option, data] of Object.entries(item.vote_counts)) {
      if (data.weight > maxWeight) {
        maxWeight = data.weight
        winningOption = { option, weight: data.weight, count: data.count }
      }
    }
    
    return winningOption
  }

  // Calcula a porcentagem para cada opção
  const getPercentage = (weight, totalWeight) => {
    if (totalWeight === 0) return 0
    return (weight / totalWeight * 100).toFixed(1)
  }

  // Função para gerar PDF
  const generatePDF = () => {
    const doc = new jsPDF()
    let yPosition = 20

    // Título
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 100)
    doc.text('Relatório de Resultados da Votação', 14, yPosition)
    yPosition += 10

    // Informações da Assembleia
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    if (assemblyInfo) {
      doc.text(`Assembleia: ${assemblyInfo.name || 'Não informado'}`, 14, yPosition)
      yPosition += 7
      doc.text(`Número: ${assemblyInfo.number || '-'}`, 14, yPosition)
      yPosition += 7
      if (assemblyInfo.date) {
        doc.text(`Data: ${new Date(assemblyInfo.date).toLocaleDateString('pt-BR')}`, 14, yPosition)
        yPosition += 10
      }
    }

    // Para cada item
    Object.values(votesByItem).forEach((item, itemIndex) => {
      // Verificar se cabe na página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      const winningOption = getWinningOption(item)

      // Título do item
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 100)
      doc.text(`Item ${item.item_order}: ${item.item_description}`, 14, yPosition)
      yPosition += 8

      // Resumo do vencedor
      if (winningOption) {
        doc.setFontSize(11)
        doc.setTextColor(180, 140, 0)
        doc.text(`🏆 Vencedor: ${winningOption.option} (${winningOption.weight} votos)`, 14, yPosition)
        yPosition += 8
      }

      doc.setTextColor(80, 80, 80)
      doc.setFontSize(10)
      doc.text(`Total de votos: ${item.total_votes} | Peso total: ${item.total_weight} votos`, 14, yPosition)
      yPosition += 10

      // Tabela de votos - usando autoTable importado
      const tableData = item.votes.map(vote => [
        vote.voter_name,
        vote.apartment,
        vote.voter_email,
        vote.vote,
        vote.voting_weight.toString()
      ])

      const tableHeaders = [['Morador', 'Apartamento', 'Email', 'Voto', 'Peso']]
      
      // ✅ Usar autoTable corretamente
      autoTable(doc, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })

      yPosition = doc.lastAutoTable.finalY + 15
    })

    // Salvar PDF
    doc.save('resultados_votacao.pdf')
  }

  if (!votesByItem || Object.keys(votesByItem).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Nenhum voto registrado para esta votação.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" ref={tableRef}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-700">📋 Detalhamento de Votos por Item</h3>
        <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>
      
      {Object.values(votesByItem).map((item) => {
        const isExpanded = expandedItems[item.item_id]
        const winningOption = getWinningOption(item)
        
        return (
          <Card key={item.item_id} className="overflow-hidden">
            {/* Cabeçalho do item - clicável */}
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleItemExpand(item.item_id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      Item {item.item_order}: {item.item_description}
                    </CardTitle>
                    {winningOption && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        <Trophy className="w-3 h-3" />
                        Vencedor: {winningOption.option}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Total de votos: {item.total_votes} | 
                    Peso total: {item.total_weight} votos
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                {/* Resumo por opção com destaque para o vencedor */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Resumo por opção:</h4>
                  <div className="space-y-3">
                    {Object.entries(item.vote_counts).map(([option, data]) => {
                      const percentage = getPercentage(data.weight, item.total_weight)
                      const isWinner = winningOption && winningOption.option === option
                      
                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isWinner ? 'text-yellow-700' : 'text-gray-700'}`}>
                                {option}
                              </span>
                              {isWinner && (
                                <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                  <Trophy className="w-3 h-3" />
                                  VENCEDOR
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-mono">
                                {data.weight} votos ({percentage}%)
                              </span>
                              <span className="text-gray-400 text-xs ml-2">
                                ({data.count} votante(s))
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isWinner ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Tabela detalhada */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Morador</TableHead>
                        <TableHead>Apartamento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Voto</TableHead>
                        <TableHead className="text-center">Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {item.votes.map((vote, idx) => (
                        <TableRow key={idx} className={vote.is_proxy_vote ? 'bg-blue-50' : ''}>
                          <TableCell className="font-medium">
                            {vote.voter_name}
                            {vote.is_proxy_vote && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                +{vote.voting_weight - 1} procuração(ões)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{vote.apartment}</TableCell>
                          <TableCell className="text-sm">{vote.voter_email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getVoteClass(vote.vote, item.item_type)}`}>
                              {vote.vote}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium">
                            {vote.voting_weight}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Totalização do item com destaque para vencedor */}
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-blue-800">Totalizações do Item:</span>
                      <div className="text-sm text-blue-700 mt-1">
                        Votos nominais: {item.total_votes}
                      </div>
                      <div className="text-sm font-bold text-blue-800">
                        Peso total: {item.total_weight} votos
                      </div>
                    </div>
                    {winningOption && (
                      <div className="text-right">
                        <div className="text-sm text-yellow-700">🏆 Resultado:</div>
                        <div className="font-bold text-yellow-800">
                          {winningOption.option} venceu com {winningOption.weight} votos
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}