# Regras do Projeto (Nuu Prensado)

- **Publicação Automática**: Sempre que realizar alterações, correções ou melhorias solicitadas no projeto, faça o commit com uma mensagem descritiva em português e envie imediatamente para o repositório remoto via `git push origin master` para disparar o deploy contínuo (Vercel).

- **Proteção e Integridade Absoluta da Operação Real**: NUNCA alterar, apagar, sobrescrever, redefinir, zerar ou resetar nenhum dado da operação real em andamento enquanto realizamos modificações no código. Isso se aplica estritamente a:
  - Pedidos reais que chegaram ou estão registrados no sistema (em qualquer status: pendentes, preparando, em rota ou concluídos).
  - Valores reais faturados, transações financeiras, fechamentos e turnos de caixa.
  - Dados de clientes reais e histórico de fidelidade.
  - Estoque real movimentado na cozinha.
  - Qualquer rotina de sincronização ou código deve SEMPRE preservar, mesclar e nunca sobrescrever dados reais da operação com estados vazios ou dados fictícios.
