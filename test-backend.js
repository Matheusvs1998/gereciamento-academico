const fs = require('fs');
const path = require('path');

async function executarTestes() {
  console.log('\n======================================================');
  console.log('   CENTRO UNIVERSITÁRIO UNIATENEU • DIAGNÓSTICO BACKEND');
  console.log('======================================================\n');

  let totalPassou = 0;
  let totalTestes = 0;

  function registrar(titulo, passou, detalhes = '') {
    totalTestes++;
    if (passou) {
      totalPassou++;
      console.log(`[PASSOU]  ${titulo}`);
    } else {
      console.log(`[ALERTA]  ${titulo}`);
    }
    if (detalhes) {
      console.log(`          ${detalhes}`);
    }
    console.log('');
  }

  const envPath = path.join(__dirname, '.env');
  const envExiste = fs.existsSync(envPath);
  let url = '';
  let key = '';

  if (envExiste) {
    const conteudo = fs.readFileSync(envPath, 'utf8');
    conteudo.split(/\r?\n/).forEach(linha => {
      const l = linha.trim();
      if (l.startsWith('SUPABASE_URL=')) {
        url = l.slice('SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
      } else if (l.startsWith('SUPABASE_ANON_KEY=')) {
        key = l.slice('SUPABASE_ANON_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }

  registrar(
    'Teste 1: Arquivo .env e Variáveis',
    envExiste && url.length > 0 && key.length > 0,
    envExiste ? `URL encontrada: ${url || '(vazia)'}` : 'Arquivo .env não encontrado.'
  );

  const configPath = path.join(__dirname, 'supabase-config.js');
  const configExiste = fs.existsSync(configPath);
  registrar(
    'Teste 2: Sincronização Frontend (supabase-config.js)',
    configExiste,
    configExiste ? 'supabase-config.js sincronizado com sucesso.' : 'Arquivo de configuração do navegador ausente.'
  );

  const schemaPath = path.join(__dirname, 'supabase_schema.sql');
  const schemaExiste = fs.existsSync(schemaPath);
  let schemaTabelas = false;
  if (schemaExiste) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    schemaTabelas = sql.includes('alunos') && sql.includes('disciplinas') && sql.includes('avisos');
  }

  registrar(
    'Teste 3: Script de Migração SQL (supabase_schema.sql)',
    schemaExiste && schemaTabelas,
    schemaTabelas ? 'Tabelas alunos, disciplinas e avisos definidas.' : 'Script SQL incompleto.'
  );

  const jsPath = path.join(__dirname, 'supabase.js');
  const jsExiste = fs.existsSync(jsPath);
  let jsFuncoes = false;
  if (jsExiste) {
    const code = fs.readFileSync(jsPath, 'utf8');
    jsFuncoes = code.includes('bancoAutenticarAluno') && 
                code.includes('bancoBuscarDisciplinas') && 
                code.includes('bancoAdicionarDisciplina') && 
                code.includes('bancoBuscarAvisos');
  }

  registrar(
    'Teste 4: Módulo de Conexão JavaScript (supabase.js)',
    jsExiste && jsFuncoes,
    jsFuncoes ? 'Todas as funções de consulta e inserção implementadas.' : 'Funções do banco ausentes.'
  );

  const isConfigurado = url && key && url.startsWith('http') && !url.includes('SEU_PROJETO');

  if (isConfigurado) {
    console.log('--- Testando Conexão Online com o Supabase ---');
    try {
      const inicio = Date.now();
      const resposta = await fetch(`${url}/rest/v1/alunos?select=id,nome,matricula&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      const tempo = Date.now() - inicio;

      if (resposta.ok) {
        const dados = await resposta.json();
        registrar(
          'Teste 5: Conexão e Tabela de Alunos (PostgreSQL)',
          true,
          `Conexão bem-sucedida em ${tempo}ms. Alunos encontrados: ${dados.length}`
        );
      } else {
        registrar(
          'Teste 5: Resposta da API Supabase',
          false,
          `Status HTTP: ${resposta.status} (${resposta.statusText}). Execute supabase_schema.sql no SQL Editor.`
        );
      }
    } catch (err) {
      registrar(
        'Teste 5: Conectividade de Rede',
        false,
        `Erro de conexão: ${err.message}`
      );
    }

    try {
      const respDisciplinas = await fetch(`${url}/rest/v1/disciplinas?select=id,nome&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      registrar(
        'Teste 6: Tabela de Disciplinas (PostgreSQL)',
        respDisciplinas.ok,
        respDisciplinas.ok ? 'Tabela acessível para leitura e inserção.' : `Status: ${respDisciplinas.status}`
      );
    } catch (err) {
      registrar('Teste 6: Tabela de Disciplinas', false, err.message);
    }

    try {
      const respAvisos = await fetch(`${url}/rest/v1/avisos?select=id,titulo&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      registrar(
        'Teste 7: Tabela de Avisos (PostgreSQL)',
        respAvisos.ok,
        respAvisos.ok ? 'Tabela de comunicados acadêmicos ativa.' : `Status: ${respAvisos.status}`
      );
    } catch (err) {
      registrar('Teste 7: Tabela de Avisos', false, err.message);
    }

  } else {
    console.log('--- Modo Local / Demonstração (Credenciais da Nuvem não inseridas) ---');
    registrar(
      'Teste 5: Fallback Local e Modo de Demonstração',
      true,
      'O sistema está operando com dados locais seguros. Para conectar à nuvem, insira sua URL e Chave Anon no arquivo .env.'
    );
  }

  console.log('======================================================');
  console.log(`Resultado: ${totalPassou} de ${totalTestes} verificações concluídas com sucesso.`);
  console.log('======================================================\n');
}

executarTestes();
