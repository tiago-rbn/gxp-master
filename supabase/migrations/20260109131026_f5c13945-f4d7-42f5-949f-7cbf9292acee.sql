-- Create document_templates table with versioning support
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  gamp_category TEXT,
  system_name TEXT,
  content TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  parent_template_id UUID REFERENCES public.document_templates(id),
  placeholders JSONB DEFAULT '[]'::jsonb,
  conditional_blocks JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view templates in their company" 
ON public.document_templates 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert templates in their company" 
ON public.document_templates 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update templates in their company" 
ON public.document_templates 
FOR UPDATE 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete templates in their company" 
ON public.document_templates 
FOR DELETE 
USING (company_id = get_user_company_id(auth.uid()));

-- Create template_versions table for version history
CREATE TABLE public.template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT,
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for template_versions
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template versions in their company" 
ON public.template_versions 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert template versions in their company" 
ON public.template_versions 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Indexes for better performance
CREATE INDEX idx_document_templates_company ON public.document_templates(company_id);
CREATE INDEX idx_document_templates_type ON public.document_templates(document_type);
CREATE INDEX idx_document_templates_gamp ON public.document_templates(gamp_category);
CREATE INDEX idx_template_versions_template ON public.template_versions(template_id);

-- Trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to populate default document templates
CREATE OR REPLACE FUNCTION public.populate_default_document_templates(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- URS Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'User Requirement Specification (URS)', 'Template padrão para especificação de requisitos do usuário', 'URS', NULL, 
  '# Especificação de Requisitos do Usuário (URS)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Versão:** {{documento.versao}}
- **Data:** {{documento.data}}
- **Autor:** {{autor.nome}}

## 1. Objetivo
Este documento descreve os requisitos do usuário para o sistema {{sistema.nome}}.

## 2. Escopo
{{projeto.escopo}}

## 3. Requisitos Funcionais

### 3.1. {{requisito.codigo}}
**Descrição:** {{requisito.descricao}}
**Prioridade:** {{requisito.prioridade}}
**Critério de Aceitação:** {{requisito.criterio_aceitacao}}

## 4. Requisitos Não-Funcionais
{{requisitos_nao_funcionais}}

## 5. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |', 
  true, 
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "documento.versao", "label": "Versão do Documento"}, {"key": "documento.data", "label": "Data do Documento"}, {"key": "autor.nome", "label": "Nome do Autor"}, {"key": "projeto.escopo", "label": "Escopo do Projeto"}, {"key": "requisito.codigo", "label": "Código do Requisito"}, {"key": "requisito.descricao", "label": "Descrição do Requisito"}, {"key": "requisito.prioridade", "label": "Prioridade"}, {"key": "requisito.criterio_aceitacao", "label": "Critério de Aceitação"}, {"key": "requisitos_nao_funcionais", "label": "Requisitos Não-Funcionais"}, {"key": "revisor.nome", "label": "Nome do Revisor"}, {"key": "aprovador.nome", "label": "Nome do Aprovador"}]'::jsonb);

  -- FS Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Functional Specification (FS)', 'Template padrão para especificação funcional', 'FS', NULL,
  '# Especificação Funcional (FS)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Versão:** {{documento.versao}}
- **Data:** {{documento.data}}

## 1. Introdução
{{introducao}}

## 2. Arquitetura do Sistema
{{arquitetura}}

## 3. Funcionalidades

### 3.1. {{funcionalidade.nome}}
**Descrição:** {{funcionalidade.descricao}}
**Requisitos Relacionados:** {{funcionalidade.requisitos}}

## 4. Integrações
{{integracoes}}

## 5. Segurança e Controle de Acesso
{{seguranca}}

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "documento.versao", "label": "Versão"}, {"key": "documento.data", "label": "Data"}, {"key": "introducao", "label": "Introdução"}, {"key": "arquitetura", "label": "Arquitetura"}, {"key": "funcionalidade.nome", "label": "Nome da Funcionalidade"}, {"key": "funcionalidade.descricao", "label": "Descrição"}, {"key": "funcionalidade.requisitos", "label": "Requisitos Relacionados"}, {"key": "integracoes", "label": "Integrações"}, {"key": "seguranca", "label": "Segurança"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- DS Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Design Specification (DS)', 'Template padrão para especificação de design', 'DS', '5',
  '# Especificação de Design (DS)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Versão:** {{documento.versao}}
- **Data:** {{documento.data}}

## 1. Visão Geral do Design
{{visao_geral}}

## 2. Arquitetura Técnica
{{arquitetura_tecnica}}

## 3. Modelo de Dados
{{modelo_dados}}

## 4. Interfaces
{{interfaces}}

## 5. Rastreabilidade
| Requisito | Componente de Design |
|-----------|---------------------|
| {{requisito.codigo}} | {{componente}} |

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "documento.versao", "label": "Versão"}, {"key": "documento.data", "label": "Data"}, {"key": "visao_geral", "label": "Visão Geral"}, {"key": "arquitetura_tecnica", "label": "Arquitetura Técnica"}, {"key": "modelo_dados", "label": "Modelo de Dados"}, {"key": "interfaces", "label": "Interfaces"}, {"key": "requisito.codigo", "label": "Código do Requisito"}, {"key": "componente", "label": "Componente"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- RA (Risk Assessment) Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Risk Assessment (RA)', 'Template padrão para análise de riscos', 'RA', NULL,
  '# Análise de Riscos (RA)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Categoria GAMP:** {{sistema.gamp}}
- **Data:** {{documento.data}}

## 1. Objetivo
Identificar e avaliar riscos associados ao sistema {{sistema.nome}}.

## 2. Metodologia
{{metodologia}}

## 3. Identificação de Riscos

### 3.1. {{risco.id}}
- **Descrição:** {{risco.descricao}}
- **Severidade:** {{risco.severidade}}
- **Probabilidade:** {{risco.probabilidade}}
- **Detectabilidade:** {{risco.detectabilidade}}
- **RPN:** {{risco.rpn}}
- **Controles:** {{risco.controles}}
- **Risco Residual:** {{risco.residual}}

## 4. Matriz de Riscos
{{matriz_riscos}}

## 5. Plano de Mitigação
{{plano_mitigacao}}

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "sistema.gamp", "label": "Categoria GAMP"}, {"key": "documento.data", "label": "Data"}, {"key": "metodologia", "label": "Metodologia"}, {"key": "risco.id", "label": "ID do Risco"}, {"key": "risco.descricao", "label": "Descrição do Risco"}, {"key": "risco.severidade", "label": "Severidade"}, {"key": "risco.probabilidade", "label": "Probabilidade"}, {"key": "risco.detectabilidade", "label": "Detectabilidade"}, {"key": "risco.rpn", "label": "RPN"}, {"key": "risco.controles", "label": "Controles"}, {"key": "risco.residual", "label": "Risco Residual"}, {"key": "matriz_riscos", "label": "Matriz de Riscos"}, {"key": "plano_mitigacao", "label": "Plano de Mitigação"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- VP (Validation Plan) Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Validation Plan (VP)', 'Template padrão para plano de validação', 'VP', NULL,
  '# Plano de Validação (VP)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Projeto:** {{projeto.nome}}
- **Data:** {{documento.data}}

## 1. Objetivo
{{objetivo}}

## 2. Escopo
{{escopo}}

## 3. Estratégia de Validação
- **Categoria GAMP:** {{sistema.gamp}}
- **Abordagem:** {{abordagem}}

## 4. Entregáveis
{{entregaveis}}

## 5. Cronograma
{{cronograma}}

## 6. Responsabilidades
| Papel | Responsável |
|-------|-------------|
| Gerente de Projeto | {{gerente}} |
| Validador | {{validador}} |
| QA | {{qa}} |

## 7. Critérios de Aceitação
{{criterios_aceitacao}}

## 8. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "projeto.nome", "label": "Nome do Projeto"}, {"key": "documento.data", "label": "Data"}, {"key": "objetivo", "label": "Objetivo"}, {"key": "escopo", "label": "Escopo"}, {"key": "sistema.gamp", "label": "Categoria GAMP"}, {"key": "abordagem", "label": "Abordagem"}, {"key": "entregaveis", "label": "Entregáveis"}, {"key": "cronograma", "label": "Cronograma"}, {"key": "gerente", "label": "Gerente de Projeto"}, {"key": "validador", "label": "Validador"}, {"key": "qa", "label": "QA"}, {"key": "criterios_aceitacao", "label": "Critérios de Aceitação"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- IQ Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Installation Qualification (IQ)', 'Template padrão para qualificação de instalação', 'IQ', NULL,
  '# Protocolo de Qualificação de Instalação (IQ)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Versão:** {{sistema.versao}}
- **Data:** {{documento.data}}

## 1. Objetivo
Verificar que o sistema {{sistema.nome}} foi instalado corretamente conforme as especificações.

## 2. Pré-requisitos
{{pre_requisitos}}

## 3. Verificações de Instalação

### 3.1. Verificação de Hardware
| Item | Especificado | Instalado | Resultado |
|------|--------------|-----------|-----------|
| {{hardware.item}} | {{hardware.especificado}} | | ☐ Conforme ☐ Não Conforme |

### 3.2. Verificação de Software
| Componente | Versão Requerida | Versão Instalada | Resultado |
|------------|------------------|------------------|-----------|
| {{software.componente}} | {{software.versao_req}} | | ☐ Conforme ☐ Não Conforme |

## 4. Desvios
{{desvios}}

## 5. Conclusão
{{conclusao}}

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Executor | {{executor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "sistema.versao", "label": "Versão do Sistema"}, {"key": "documento.data", "label": "Data"}, {"key": "pre_requisitos", "label": "Pré-requisitos"}, {"key": "hardware.item", "label": "Item de Hardware"}, {"key": "hardware.especificado", "label": "Especificação"}, {"key": "software.componente", "label": "Componente de Software"}, {"key": "software.versao_req", "label": "Versão Requerida"}, {"key": "desvios", "label": "Desvios"}, {"key": "conclusao", "label": "Conclusão"}, {"key": "executor.nome", "label": "Executor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- OQ Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Operational Qualification (OQ)', 'Template padrão para qualificação operacional', 'OQ', NULL,
  '# Protocolo de Qualificação Operacional (OQ)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Data:** {{documento.data}}

## 1. Objetivo
Verificar que o sistema {{sistema.nome}} opera conforme as especificações funcionais.

## 2. Pré-requisitos
- IQ aprovado
- {{pre_requisitos}}

## 3. Casos de Teste

### Caso de Teste: {{teste.codigo}}
**Requisito:** {{teste.requisito}}
**Objetivo:** {{teste.objetivo}}
**Pré-condições:** {{teste.precondições}}

| Passo | Ação | Resultado Esperado | Resultado Obtido | Status |
|-------|------|-------------------|------------------|--------|
| {{passo.numero}} | {{passo.acao}} | {{passo.esperado}} | | ☐ Pass ☐ Fail |

## 4. Desvios
{{desvios}}

## 5. Conclusão
{{conclusao}}

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Executor | {{executor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "documento.data", "label": "Data"}, {"key": "pre_requisitos", "label": "Pré-requisitos"}, {"key": "teste.codigo", "label": "Código do Teste"}, {"key": "teste.requisito", "label": "Requisito"}, {"key": "teste.objetivo", "label": "Objetivo"}, {"key": "teste.precondições", "label": "Pré-condições"}, {"key": "passo.numero", "label": "Número do Passo"}, {"key": "passo.acao", "label": "Ação"}, {"key": "passo.esperado", "label": "Resultado Esperado"}, {"key": "desvios", "label": "Desvios"}, {"key": "conclusao", "label": "Conclusão"}, {"key": "executor.nome", "label": "Executor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- PQ Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Performance Qualification (PQ)', 'Template padrão para qualificação de performance', 'PQ', NULL,
  '# Protocolo de Qualificação de Performance (PQ)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Data:** {{documento.data}}

## 1. Objetivo
Demonstrar que o sistema {{sistema.nome}} opera consistentemente conforme os requisitos do usuário em condições reais de uso.

## 2. Pré-requisitos
- IQ aprovado
- OQ aprovado
- {{pre_requisitos}}

## 3. Testes de Performance

### {{teste.codigo}}
**Objetivo:** {{teste.objetivo}}
**Critério de Aceitação:** {{teste.criterio}}

| Execução | Data | Resultado | Status |
|----------|------|-----------|--------|
| 1 | | | ☐ Pass ☐ Fail |
| 2 | | | ☐ Pass ☐ Fail |
| 3 | | | ☐ Pass ☐ Fail |

## 4. Desvios
{{desvios}}

## 5. Conclusão
{{conclusao}}

## 6. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Executor | {{executor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "documento.data", "label": "Data"}, {"key": "pre_requisitos", "label": "Pré-requisitos"}, {"key": "teste.codigo", "label": "Código do Teste"}, {"key": "teste.objetivo", "label": "Objetivo"}, {"key": "teste.criterio", "label": "Critério de Aceitação"}, {"key": "desvios", "label": "Desvios"}, {"key": "conclusao", "label": "Conclusão"}, {"key": "executor.nome", "label": "Executor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- RTM Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Requirements Traceability Matrix (RTM)', 'Template padrão para matriz de rastreabilidade', 'RTM', NULL,
  '# Matriz de Rastreabilidade de Requisitos (RTM)

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Projeto:** {{projeto.nome}}
- **Data:** {{documento.data}}

## 1. Objetivo
Demonstrar a rastreabilidade entre requisitos do usuário, especificações e testes para o sistema {{sistema.nome}}.

## 2. Matriz de Rastreabilidade

| Requisito (URS) | Especificação (FS) | Caso de Teste | Resultado | Status |
|-----------------|-------------------|---------------|-----------|--------|
| {{urs.codigo}} | {{fs.codigo}} | {{teste.codigo}} | {{teste.resultado}} | {{status}} |

## 3. Resumo de Cobertura
- **Total de Requisitos:** {{total_requisitos}}
- **Requisitos Cobertos:** {{requisitos_cobertos}}
- **Cobertura:** {{percentual_cobertura}}%

## 4. Conclusão
{{conclusao}}

## 5. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "projeto.nome", "label": "Nome do Projeto"}, {"key": "documento.data", "label": "Data"}, {"key": "urs.codigo", "label": "Código URS"}, {"key": "fs.codigo", "label": "Código FS"}, {"key": "teste.codigo", "label": "Código do Teste"}, {"key": "teste.resultado", "label": "Resultado"}, {"key": "status", "label": "Status"}, {"key": "total_requisitos", "label": "Total de Requisitos"}, {"key": "requisitos_cobertos", "label": "Requisitos Cobertos"}, {"key": "percentual_cobertura", "label": "Percentual de Cobertura"}, {"key": "conclusao", "label": "Conclusão"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);

  -- VR (Validation Report) Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Validation Report (VR)', 'Template padrão para relatório final de validação', 'VR', NULL,
  '# Relatório Final de Validação

## Informações do Documento
- **Sistema:** {{sistema.nome}}
- **Projeto:** {{projeto.nome}}
- **Data:** {{documento.data}}

## 1. Sumário Executivo
{{sumario_executivo}}

## 2. Escopo da Validação
{{escopo}}

## 3. Documentação de Validação
| Documento | Versão | Status |
|-----------|--------|--------|
| Plano de Validação | {{vp.versao}} | {{vp.status}} |
| URS | {{urs.versao}} | {{urs.status}} |
| FS | {{fs.versao}} | {{fs.status}} |
| RA | {{ra.versao}} | {{ra.status}} |
| IQ | {{iq.versao}} | {{iq.status}} |
| OQ | {{oq.versao}} | {{oq.status}} |
| PQ | {{pq.versao}} | {{pq.status}} |
| RTM | {{rtm.versao}} | {{rtm.status}} |

## 4. Resumo de Testes
- **Total de Testes:** {{total_testes}}
- **Testes Aprovados:** {{testes_aprovados}}
- **Testes com Desvio:** {{testes_desvio}}

## 5. Desvios e CAPA
{{desvios}}

## 6. Conclusão
{{conclusao}}

## 7. Declaração de Validação
Com base nos resultados apresentados, o sistema {{sistema.nome}} está validado e aprovado para uso em produção.

## 8. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Gerente de Validação | {{gerente.nome}} | | |
| QA | {{qa.nome}} | | |
| Proprietário do Sistema | {{owner.nome}} | | |',
  true,
  '[{"key": "sistema.nome", "label": "Nome do Sistema"}, {"key": "projeto.nome", "label": "Nome do Projeto"}, {"key": "documento.data", "label": "Data"}, {"key": "sumario_executivo", "label": "Sumário Executivo"}, {"key": "escopo", "label": "Escopo"}, {"key": "vp.versao", "label": "Versão VP"}, {"key": "vp.status", "label": "Status VP"}, {"key": "urs.versao", "label": "Versão URS"}, {"key": "urs.status", "label": "Status URS"}, {"key": "fs.versao", "label": "Versão FS"}, {"key": "fs.status", "label": "Status FS"}, {"key": "ra.versao", "label": "Versão RA"}, {"key": "ra.status", "label": "Status RA"}, {"key": "iq.versao", "label": "Versão IQ"}, {"key": "iq.status", "label": "Status IQ"}, {"key": "oq.versao", "label": "Versão OQ"}, {"key": "oq.status", "label": "Status OQ"}, {"key": "pq.versao", "label": "Versão PQ"}, {"key": "pq.status", "label": "Status PQ"}, {"key": "rtm.versao", "label": "Versão RTM"}, {"key": "rtm.status", "label": "Status RTM"}, {"key": "total_testes", "label": "Total de Testes"}, {"key": "testes_aprovados", "label": "Testes Aprovados"}, {"key": "testes_desvio", "label": "Testes com Desvio"}, {"key": "desvios", "label": "Desvios"}, {"key": "conclusao", "label": "Conclusão"}, {"key": "gerente.nome", "label": "Gerente de Validação"}, {"key": "qa.nome", "label": "QA"}, {"key": "owner.nome", "label": "Proprietário do Sistema"}]'::jsonb);

  -- SOP Template
  INSERT INTO public.document_templates (company_id, name, description, document_type, gamp_category, content, is_default, placeholders) VALUES
  (_company_id, 'Standard Operating Procedure (SOP)', 'Template padrão para procedimento operacional padrão', 'SOP', NULL,
  '# Procedimento Operacional Padrão (SOP)

## Informações do Documento
- **Título:** {{sop.titulo}}
- **Número:** {{sop.numero}}
- **Versão:** {{documento.versao}}
- **Data de Vigência:** {{documento.data}}

## 1. Objetivo
{{objetivo}}

## 2. Escopo
{{escopo}}

## 3. Definições e Abreviações
{{definicoes}}

## 4. Responsabilidades
| Papel | Responsabilidade |
|-------|-----------------|
| {{papel}} | {{responsabilidade}} |

## 5. Procedimento

### 5.1. {{etapa.titulo}}
{{etapa.descricao}}

## 6. Documentos Relacionados
{{documentos_relacionados}}

## 7. Anexos
{{anexos}}

## 8. Histórico de Revisões
| Versão | Data | Descrição | Autor |
|--------|------|-----------|-------|
| {{versao}} | {{data}} | {{descricao}} | {{autor}} |

## 9. Aprovações
| Função | Nome | Assinatura | Data |
|--------|------|------------|------|
| Elaborador | {{autor.nome}} | | |
| Revisor | {{revisor.nome}} | | |
| Aprovador | {{aprovador.nome}} | | |',
  true,
  '[{"key": "sop.titulo", "label": "Título do SOP"}, {"key": "sop.numero", "label": "Número do SOP"}, {"key": "documento.versao", "label": "Versão"}, {"key": "documento.data", "label": "Data de Vigência"}, {"key": "objetivo", "label": "Objetivo"}, {"key": "escopo", "label": "Escopo"}, {"key": "definicoes", "label": "Definições"}, {"key": "papel", "label": "Papel"}, {"key": "responsabilidade", "label": "Responsabilidade"}, {"key": "etapa.titulo", "label": "Título da Etapa"}, {"key": "etapa.descricao", "label": "Descrição da Etapa"}, {"key": "documentos_relacionados", "label": "Documentos Relacionados"}, {"key": "anexos", "label": "Anexos"}, {"key": "versao", "label": "Versão (histórico)"}, {"key": "data", "label": "Data (histórico)"}, {"key": "descricao", "label": "Descrição (histórico)"}, {"key": "autor", "label": "Autor (histórico)"}, {"key": "autor.nome", "label": "Autor"}, {"key": "revisor.nome", "label": "Revisor"}, {"key": "aprovador.nome", "label": "Aprovador"}]'::jsonb);
END;
$$;