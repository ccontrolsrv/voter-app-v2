import { useState } from 'react'
import CondSel from './CondSel'
import VoterLogin from './VoterLogin'
import VoterAssemblyOptions from './VoterAssemblyOptions'
import VotingBooth from './VotingBooth'
import VotingConfirmation from './VotingConfirmation'

export default function VotingModule() {
  const [votingFlow, setVotingFlow] = useState({
    step: 'selection',  // selection, login, options, voting, confirmation
    condominiumId: null,
    condominiumName: null,
    voter: null,
    assembly: null,           // Assembleia atual (para exibição)
    selectedAssembly: null,   // Assembleia selecionada para votar
    votes: {},
    votingWeight: 1
  })

  const nextStep = (step, data) => {
    setVotingFlow(prev => ({ ...prev, step, ...data }))
  }

  switch (votingFlow.step) {
    case 'selection':
      return <CondSel onSelect={(condId, condName) => 
        nextStep('login', { condominiumId: condId, condominiumName: condName })
      } />
    
    case 'login':
      return <VoterLogin 
        condominiumId={votingFlow.condominiumId}
        condominiumName={votingFlow.condominiumName}
        onLoginSuccess={(voter, assembly, votingWeight) => {
          console.log('Login success - assembly:', assembly)
          // Armazena tanto em assembly quanto em selectedAssembly
          nextStep('options', { 
            voter, 
            assembly,
            selectedAssembly: assembly,
            votingWeight 
          })
        }}
        onBack={() => nextStep('selection')}
      />
    
    case 'options':
      // Verificação de segurança
      if (!votingFlow.selectedAssembly) {
        console.error('Erro: selectedAssembly é null em options')
        return <div className="p-4 text-red-500">Erro: Assembleia não carregada. Volte e tente novamente.</div>
      }
      
      return <VoterAssemblyOptions 
        voter={votingFlow.voter}
        assembly={votingFlow.selectedAssembly}
        votingWeight={votingFlow.votingWeight}
        condominiumId={votingFlow.condominiumId}
        onVote={() => nextStep('voting')}
        onBack={() => nextStep('login')}
      />
    
    case 'voting':
      // Verificação de segurança
      if (!votingFlow.selectedAssembly) {
        console.error('Erro: selectedAssembly é null em voting')
        return <div className="p-4 text-red-500">Erro: Assembleia não selecionada. Volte e tente novamente.</div>
      }
      
      return <VotingBooth 
        voter={votingFlow.voter}
        assembly={votingFlow.selectedAssembly}
        votingWeight={votingFlow.votingWeight}
        condominiumId={votingFlow.condominiumId}
        onVotingComplete={(votes) => 
          nextStep('confirmation', { votes })
        }
        onBack={() => nextStep('options')}
      />

    case 'confirmation':
      return <VotingConfirmation 
        voter={votingFlow.voter}
        assembly={votingFlow.selectedAssembly}
        onFinish={() => {
          // Volta para a tela de opções, mantendo os dados
          setVotingFlow(prev => ({ 
            ...prev, 
            step: 'options',
            // Mantém todos os dados existentes
            condominiumId: prev.condominiumId,
            condominiumName: prev.condominiumName,
            voter: prev.voter,
            assembly: prev.selectedAssembly,
            selectedAssembly: prev.selectedAssembly,
            votingWeight: prev.votingWeight
          }))
        }}
      />
    
    default:
      return <CondSel onSelect={() => {}} />
  }
}