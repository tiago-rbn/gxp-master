-- Create function to populate default deliverable templates for a company
CREATE OR REPLACE FUNCTION public.populate_default_deliverable_templates(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- GAMP 1 - Infrastructure Software
  INSERT INTO public.deliverable_templates (company_id, gamp_category, name, description, document_type, is_mandatory, sort_order) VALUES
  (_company_id, '1', 'Inventário de Infraestrutura', 'Lista de componentes de infraestrutura e suas configurações', 'IQ', true, 1),
  (_company_id, '1', 'Procedimento de Backup', 'Procedimento para backup e restore do sistema', 'SOP', true, 2),
  (_company_id, '1', 'Qualificação de Instalação', 'Verificação da instalação correta da infraestrutura', 'IQ', true, 3),
  (_company_id, '1', 'Plano de Manutenção', 'Plano de manutenção preventiva e corretiva', 'SOP', false, 4);

  -- GAMP 3 - Non-configured Products
  INSERT INTO public.deliverable_templates (company_id, gamp_category, name, description, document_type, is_mandatory, sort_order) VALUES
  (_company_id, '3', 'Especificação de Requisitos do Usuário', 'Documento com os requisitos do usuário para o sistema', 'URS', true, 1),
  (_company_id, '3', 'Avaliação de Fornecedor', 'Avaliação do fornecedor do software', 'VAR', true, 2),
  (_company_id, '3', 'Qualificação de Instalação', 'Protocolo de qualificação de instalação', 'IQ', true, 3),
  (_company_id, '3', 'Qualificação de Operação', 'Protocolo de qualificação operacional', 'OQ', true, 4),
  (_company_id, '3', 'Relatório de Validação', 'Relatório final de validação do sistema', 'VR', true, 5),
  (_company_id, '3', 'Procedimentos Operacionais', 'SOPs para operação do sistema', 'SOP', true, 6);

  -- GAMP 4 - Configured Products
  INSERT INTO public.deliverable_templates (company_id, gamp_category, name, description, document_type, is_mandatory, sort_order) VALUES
  (_company_id, '4', 'Plano de Validação', 'Plano mestre de validação do sistema', 'VP', true, 1),
  (_company_id, '4', 'Especificação de Requisitos do Usuário', 'Documento com os requisitos do usuário', 'URS', true, 2),
  (_company_id, '4', 'Especificação Funcional', 'Especificação funcional do sistema', 'FS', true, 3),
  (_company_id, '4', 'Especificação de Configuração', 'Documentação das configurações aplicadas', 'CS', true, 4),
  (_company_id, '4', 'Avaliação de Fornecedor', 'Avaliação do fornecedor do software', 'VAR', true, 5),
  (_company_id, '4', 'Análise de Riscos', 'Análise de riscos do sistema', 'RA', true, 6),
  (_company_id, '4', 'Qualificação de Instalação', 'Protocolo IQ', 'IQ', true, 7),
  (_company_id, '4', 'Qualificação de Operação', 'Protocolo OQ', 'OQ', true, 8),
  (_company_id, '4', 'Qualificação de Performance', 'Protocolo PQ', 'PQ', true, 9),
  (_company_id, '4', 'Matriz de Rastreabilidade', 'RTM do projeto', 'RTM', true, 10),
  (_company_id, '4', 'Relatório de Validação', 'Relatório final de validação', 'VR', true, 11),
  (_company_id, '4', 'Procedimentos Operacionais', 'SOPs para operação do sistema', 'SOP', true, 12);

  -- GAMP 5 - Custom Applications
  INSERT INTO public.deliverable_templates (company_id, gamp_category, name, description, document_type, is_mandatory, sort_order) VALUES
  (_company_id, '5', 'Plano de Validação', 'Plano mestre de validação do sistema', 'VP', true, 1),
  (_company_id, '5', 'Especificação de Requisitos do Usuário', 'Requisitos do usuário detalhados', 'URS', true, 2),
  (_company_id, '5', 'Especificação Funcional', 'Especificação funcional detalhada', 'FS', true, 3),
  (_company_id, '5', 'Especificação de Design', 'Especificação técnica de design', 'DS', true, 4),
  (_company_id, '5', 'Análise de Riscos', 'Análise de riscos completa', 'RA', true, 5),
  (_company_id, '5', 'Plano de Testes', 'Plano de testes do sistema', 'TP', true, 6),
  (_company_id, '5', 'Qualificação de Instalação', 'Protocolo IQ', 'IQ', true, 7),
  (_company_id, '5', 'Qualificação de Operação', 'Protocolo OQ', 'OQ', true, 8),
  (_company_id, '5', 'Qualificação de Performance', 'Protocolo PQ', 'PQ', true, 9),
  (_company_id, '5', 'Revisão de Código', 'Documentação de revisão de código', 'CR', false, 10),
  (_company_id, '5', 'Matriz de Rastreabilidade', 'RTM completa do projeto', 'RTM', true, 11),
  (_company_id, '5', 'Relatório de Validação', 'Relatório final de validação', 'VR', true, 12),
  (_company_id, '5', 'Procedimentos Operacionais', 'SOPs para operação', 'SOP', true, 13),
  (_company_id, '5', 'Plano de Manutenção', 'Plano de manutenção do sistema', 'SOP', true, 14);
END;
$$;

-- Create function to populate default task templates for a company
CREATE OR REPLACE FUNCTION public.populate_default_task_templates(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- GAMP 1 - Infrastructure Software
  INSERT INTO public.task_templates (company_id, gamp_category, name, description, phase, estimated_hours, sort_order) VALUES
  (_company_id, '1', 'Levantamento de Requisitos', 'Identificar requisitos de infraestrutura', 'Planejamento', 8, 1),
  (_company_id, '1', 'Documentar Configurações', 'Documentar configurações atuais', 'Planejamento', 4, 2),
  (_company_id, '1', 'Executar IQ', 'Executar qualificação de instalação', 'Execução', 8, 3),
  (_company_id, '1', 'Revisar Documentação', 'Revisar toda documentação gerada', 'Revisão', 4, 4);

  -- GAMP 3 - Non-configured Products
  INSERT INTO public.task_templates (company_id, gamp_category, name, description, phase, estimated_hours, sort_order) VALUES
  (_company_id, '3', 'Elaborar URS', 'Elaborar especificação de requisitos do usuário', 'Planejamento', 16, 1),
  (_company_id, '3', 'Avaliar Fornecedor', 'Realizar avaliação do fornecedor', 'Planejamento', 8, 2),
  (_company_id, '3', 'Elaborar Protocolo IQ', 'Elaborar protocolo de qualificação de instalação', 'Planejamento', 8, 3),
  (_company_id, '3', 'Elaborar Protocolo OQ', 'Elaborar protocolo de qualificação operacional', 'Planejamento', 16, 4),
  (_company_id, '3', 'Executar IQ', 'Executar qualificação de instalação', 'Execução', 8, 5),
  (_company_id, '3', 'Executar OQ', 'Executar qualificação operacional', 'Execução', 16, 6),
  (_company_id, '3', 'Elaborar Relatório Final', 'Elaborar relatório de validação', 'Encerramento', 8, 7),
  (_company_id, '3', 'Revisar Documentação', 'Revisar e aprovar documentação', 'Revisão', 8, 8);

  -- GAMP 4 - Configured Products
  INSERT INTO public.task_templates (company_id, gamp_category, name, description, phase, estimated_hours, sort_order) VALUES
  (_company_id, '4', 'Elaborar Plano de Validação', 'Elaborar plano mestre de validação', 'Planejamento', 16, 1),
  (_company_id, '4', 'Elaborar URS', 'Elaborar especificação de requisitos do usuário', 'Planejamento', 24, 2),
  (_company_id, '4', 'Elaborar FS', 'Elaborar especificação funcional', 'Planejamento', 24, 3),
  (_company_id, '4', 'Documentar Configurações', 'Documentar todas as configurações', 'Planejamento', 16, 4),
  (_company_id, '4', 'Avaliar Fornecedor', 'Realizar avaliação do fornecedor', 'Planejamento', 8, 5),
  (_company_id, '4', 'Realizar Análise de Riscos', 'Executar análise de riscos do sistema', 'Planejamento', 16, 6),
  (_company_id, '4', 'Elaborar Protocolo IQ', 'Elaborar protocolo IQ', 'Planejamento', 8, 7),
  (_company_id, '4', 'Elaborar Protocolo OQ', 'Elaborar protocolo OQ', 'Planejamento', 24, 8),
  (_company_id, '4', 'Elaborar Protocolo PQ', 'Elaborar protocolo PQ', 'Planejamento', 16, 9),
  (_company_id, '4', 'Executar IQ', 'Executar qualificação de instalação', 'Execução', 8, 10),
  (_company_id, '4', 'Executar OQ', 'Executar qualificação operacional', 'Execução', 24, 11),
  (_company_id, '4', 'Executar PQ', 'Executar qualificação de performance', 'Execução', 16, 12),
  (_company_id, '4', 'Elaborar RTM', 'Elaborar matriz de rastreabilidade', 'Encerramento', 8, 13),
  (_company_id, '4', 'Elaborar Relatório Final', 'Elaborar relatório de validação', 'Encerramento', 16, 14),
  (_company_id, '4', 'Revisar Documentação', 'Revisar e aprovar toda documentação', 'Revisão', 16, 15);

  -- GAMP 5 - Custom Applications
  INSERT INTO public.task_templates (company_id, gamp_category, name, description, phase, estimated_hours, sort_order) VALUES
  (_company_id, '5', 'Elaborar Plano de Validação', 'Elaborar plano mestre de validação', 'Planejamento', 24, 1),
  (_company_id, '5', 'Elaborar URS', 'Elaborar especificação de requisitos detalhada', 'Planejamento', 40, 2),
  (_company_id, '5', 'Elaborar FS', 'Elaborar especificação funcional detalhada', 'Planejamento', 40, 3),
  (_company_id, '5', 'Elaborar DS', 'Elaborar especificação de design', 'Planejamento', 32, 4),
  (_company_id, '5', 'Realizar Análise de Riscos', 'Executar análise de riscos completa', 'Planejamento', 24, 5),
  (_company_id, '5', 'Elaborar Plano de Testes', 'Elaborar plano de testes do sistema', 'Planejamento', 16, 6),
  (_company_id, '5', 'Elaborar Protocolo IQ', 'Elaborar protocolo IQ', 'Planejamento', 8, 7),
  (_company_id, '5', 'Elaborar Protocolo OQ', 'Elaborar protocolo OQ', 'Planejamento', 32, 8),
  (_company_id, '5', 'Elaborar Protocolo PQ', 'Elaborar protocolo PQ', 'Planejamento', 24, 9),
  (_company_id, '5', 'Revisar Código', 'Realizar revisão de código fonte', 'Execução', 24, 10),
  (_company_id, '5', 'Executar IQ', 'Executar qualificação de instalação', 'Execução', 8, 11),
  (_company_id, '5', 'Executar OQ', 'Executar qualificação operacional', 'Execução', 40, 12),
  (_company_id, '5', 'Executar PQ', 'Executar qualificação de performance', 'Execução', 24, 13),
  (_company_id, '5', 'Elaborar RTM', 'Elaborar matriz de rastreabilidade completa', 'Encerramento', 16, 14),
  (_company_id, '5', 'Elaborar Relatório Final', 'Elaborar relatório de validação', 'Encerramento', 24, 15),
  (_company_id, '5', 'Revisar Documentação', 'Revisar e aprovar toda documentação', 'Revisão', 24, 16),
  (_company_id, '5', 'Transferir para Operação', 'Transferir sistema para operação', 'Encerramento', 8, 17);
END;
$$;

-- Create a combined function for convenience
CREATE OR REPLACE FUNCTION public.populate_default_templates(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.populate_default_deliverable_templates(_company_id);
  PERFORM public.populate_default_task_templates(_company_id);
END;
$$;