import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const documentTemplates: Record<string, string> = {
  URS: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica. 
Gere uma Especificação de Requisitos do Usuário (URS) completa e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo
- Definições e abreviações
- Requisitos funcionais detalhados
- Requisitos não-funcionais (performance, segurança, usabilidade)
- Requisitos regulatórios (21 CFR Part 11, Anvisa RDC 658)
- Critérios de aceitação
- Referências`,

  PV: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere um Plano de Validação (PV) completo e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo da validação
- Abordagem baseada em risco
- Categorização GAMP do sistema
- Estratégia de testes (IQ, OQ, PQ)
- Papéis e responsabilidades
- Critérios de aceitação
- Gerenciamento de desvios
- Cronograma de atividades
- Referências normativas`,

  IQ: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere um Protocolo de Qualificação de Instalação (IQ) completo e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo
- Pré-requisitos
- Verificação de hardware
- Verificação de software
- Verificação de rede e conectividade
- Verificação de documentação
- Verificação de ambiente
- Lista de verificações com critérios de aceitação
- Formulário de desvios
- Conclusão`,

  OQ: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere um Protocolo de Qualificação Operacional (OQ) completo e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo
- Pré-requisitos
- Casos de teste funcionais detalhados
- Testes de segurança e controle de acesso
- Testes de trilha de auditoria
- Testes de backup e recuperação
- Testes de integridade de dados
- Critérios de aceitação por teste
- Formulário de desvios
- Conclusão`,

  PQ: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere um Protocolo de Qualificação de Performance (PQ) completo e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo
- Pré-requisitos
- Cenários de uso real
- Testes de carga e performance
- Testes de integração end-to-end
- Validação com dados de produção
- Critérios de aceitação
- Formulário de desvios
- Conclusão e liberação`,

  RA: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere uma Avaliação de Risco (RA) completa e profissional em português brasileiro.
O documento deve seguir as boas práticas GAMP 5 e ICH Q9 e incluir:
- Cabeçalho com identificação do documento
- Objetivo e escopo
- Metodologia (FMEA ou similar)
- Identificação de riscos
- Análise de severidade, probabilidade e detectabilidade
- Cálculo de RPN (Risk Priority Number)
- Classificação de riscos (Alto, Médio, Baixo)
- Medidas de mitigação
- Risco residual
- Plano de ação
- Conclusão`,

  SOP: `Você é um especialista em validação de sistemas computadorizados na indústria farmacêutica.
Gere um Procedimento Operacional Padrão (SOP) completo e profissional em português brasileiro.
O documento deve seguir as boas práticas GxP e incluir:
- Cabeçalho com identificação do documento
- Objetivo
- Escopo
- Definições e abreviações
- Responsabilidades
- Procedimento detalhado passo a passo
- Registros e formulários
- Referências
- Histórico de revisões
- Anexos`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentType, systemName, systemDescription, additionalContext } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    const systemPrompt = documentTemplates[documentType] || documentTemplates['URS'];
    
    const userPrompt = `
Sistema: ${systemName}
Descrição: ${systemDescription}
${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Gere o documento completo em formato Markdown, pronto para uso profissional.
Use formatação clara com títulos, subtítulos, listas e tabelas quando apropriado.
`;

    console.log(`Generating ${documentType} document for system: ${systemName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`Erro na API OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log(`Successfully generated ${documentType} document`);

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-document function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
