const MAINTENANCE_MODE = false;

function verificarRedirecionamentoManutencao() {
  const caminho = window.location.pathname.toLowerCase();
  const pagina = caminho.substring(caminho.lastIndexOf("/") + 1) || "index.html";

  if (MAINTENANCE_MODE) {
    if (pagina !== "manutencao.html") {
      window.location.replace("manutencao.html");
    }
  } else {
    if (pagina === "manutencao.html") {
      const estaLogado = localStorage.getItem("aluno_autenticado") === "true";
      window.location.replace(estaLogado ? "painel.html" : "index.html");
    }
  }
}

verificarRedirecionamentoManutencao();

document.addEventListener("DOMContentLoaded", () => {
  inicializarTema();

  const formLogin = document.getElementById("loginForm");
  const tabelaDisciplinas = document.getElementById("listaDisciplinasBody");
  const telaManutencao = document.querySelector(".maintenance-card");

  if (formLogin) {
    configurarTelaLogin();
  }

  if (tabelaDisciplinas) {
    configurarPainelAluno();
  }

  if (telaManutencao) {
    configurarTelaManutencao();
  }
});

function configurarTelaManutencao() {
  const btnVerificar = document.getElementById("btnVerificarDisponibilidade");

  if (btnVerificar) {
    btnVerificar.addEventListener("click", () => {
      if (MAINTENANCE_MODE) {
        exibirNotificacao(
          "Sistema em Manutenção",
          "O portal continua em manutenção programada. Previsão de retorno às 22:30.",
          "warning",
          3500
        );
      } else {
        exibirNotificacao(
          "Sistema Disponível!",
          "A manutenção foi finalizada. Redirecionando para o portal...",
          "success",
          2000
        );
        setTimeout(() => {
          const estaLogado = localStorage.getItem("aluno_autenticado") === "true";
          window.location.href = estaLogado ? "painel.html" : "index.html";
        }, 500);
      }
    });
  }
}

function inicializarTema() {
  const temaSalvo = localStorage.getItem("ateneu_theme") || "light";
  document.documentElement.setAttribute("data-theme", temaSalvo);

  const iconeTema = document.getElementById("iconeTema");
  if (iconeTema) {
    iconeTema.textContent = temaSalvo === "dark" ? "☀️" : "🌙";
  }

  const btnTema = document.getElementById("btnTema");
  if (btnTema) {
    btnTema.addEventListener("click", () => {
      const temaAtual = document.documentElement.getAttribute("data-theme");
      const novoTema = temaAtual === "dark" ? "light" : "dark";
      
      document.documentElement.setAttribute("data-theme", novoTema);
      localStorage.setItem("ateneu_theme", novoTema);
      
      if (iconeTema) {
        iconeTema.textContent = novoTema === "dark" ? "☀️" : "🌙";
      }

      exibirNotificacao(
        "Aparência do Portal",
        novoTema === "dark" ? "Modo escuro ativado." : "Modo claro ativado.",
        "info",
        2800
      );
    });
  }
}

function configurarTelaLogin() {
  const form = document.getElementById("loginForm");
  const inputEmail = document.getElementById("email");
  const inputSenha = document.getElementById("senha");
  const btnToggle = document.getElementById("btnToggleSenha");
  const boxErro = document.getElementById("mensagemErro");
  const textoErro = document.getElementById("textoErro");

  if (btnToggle && inputSenha) {
    btnToggle.addEventListener("click", () => {
      const tipoAtual = inputSenha.getAttribute("type");
      if (tipoAtual === "password") {
        inputSenha.setAttribute("type", "text");
        btnToggle.textContent = "🙈";
        btnToggle.setAttribute("aria-label", "Ocultar senha");
      } else {
        inputSenha.setAttribute("type", "password");
        btnToggle.textContent = "👁️";
        btnToggle.setAttribute("aria-label", "Mostrar senha");
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identificador = inputEmail.value.trim();
    const senha = inputSenha.value.trim();

    if (!identificador || !senha) {
      exibirErro("Por favor, preencha o seu e-mail institucional/CPF e a senha.");
      return;
    }

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = "0.7";
    }

    let autenticado = false;
    let dadosAluno = null;

    if (typeof bancoAutenticarAluno === "function") {
      const resultado = await bancoAutenticarAluno(identificador, senha);
      if (resultado.sucesso) {
        autenticado = true;
        dadosAluno = resultado.aluno;
      }
    } else {
      const loginValido = (identificador === "aluno@ads.com" || identificador === "123.456.789-00" || identificador === "aluno") && senha === "123456";
      if (loginValido) {
        autenticado = true;
        dadosAluno = {
          nome: "Maria Eduarda",
          matricula: "2026.2.0491",
          curso: "Análise e Desenvolvimento de Sistemas",
          campus: "Campus Grand Shopping"
        };
      }
    }

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = "";
    }

    if (autenticado && dadosAluno) {
      localStorage.setItem("aluno_autenticado", "true");
      localStorage.setItem("aluno_nome", dadosAluno.nome || "Maria Eduarda");
      localStorage.setItem("aluno_matricula", dadosAluno.matricula || "2026.2.0491");
      localStorage.setItem("aluno_curso", dadosAluno.curso || "Análise e Desenvolvimento de Sistemas");
      localStorage.setItem("aluno_campus", dadosAluno.campus || "Campus Grand Shopping");

      window.location.href = "painel.html";
    } else {
      exibirErro("Credenciais incorretas! Use o e-mail 'aluno@ads.com' e a senha '123456'.");
    }
  });

  function exibirErro(msg) {
    if (boxErro && textoErro) {
      textoErro.textContent = msg;
      boxErro.style.display = "flex";
      inputSenha.focus();
    } else {
      alert(msg);
    }
  }

  const linkEsqueci = document.getElementById("linkEsqueciSenha");
  const linkPrimeiro = document.getElementById("btnPrimeiroAcesso");
  const modalAviso = document.getElementById("modalAvisoLogin");
  const modalAvisoTitulo = document.getElementById("modalAvisoTitulo");
  const modalAvisoTexto = document.getElementById("modalAvisoTexto");
  const btnFecharAviso = document.getElementById("btnFecharModalAviso");
  const btnOkAviso = document.getElementById("btnOkModalAviso");

  if (linkEsqueci && modalAviso) {
    linkEsqueci.addEventListener("click", (e) => {
      e.preventDefault();
      modalAvisoTitulo.textContent = "Recuperação de Senha";
      modalAvisoTexto.innerHTML = "Para redefinir sua senha institucional do <strong>Mundo UniAteneu</strong>, digite suas credenciais didáticas de teste: <br><br>• E-mail: <code>aluno@ads.com</code><br>• Senha: <code>123456</code><br><br>Em ambiente de produção, um link de verificação é enviado para o seu e-mail cadastrado na matrícula.";
      modalAviso.style.display = "flex";
    });
  }

  if (linkPrimeiro && modalAviso) {
    linkPrimeiro.addEventListener("click", (e) => {
      e.preventDefault();
      modalAvisoTitulo.textContent = "Primeiro Acesso ao Mundo UniAteneu";
      modalAvisoTexto.innerHTML = "Seja bem-vindo(a) à UniAteneu! Seu primeiro acesso é liberado com o seu <strong>CPF</strong> e a senha padrão enviada no ato da matrícula. Para este projeto de IHM, utilize <code>aluno@ads.com</code> e senha <code>123456</code>.";
      modalAviso.style.display = "flex";
    });
  }

  const fecharModalAviso = () => { if (modalAviso) modalAviso.style.display = "none"; };
  if (btnFecharAviso) btnFecharAviso.addEventListener("click", fecharModalAviso);
  if (btnOkAviso) btnOkAviso.addEventListener("click", fecharModalAviso);
}

function configurarPainelAluno() {
  
  const autenticado = localStorage.getItem("aluno_autenticado");
  if (!autenticado) {
    window.location.href = "index.html";
    return;
  }

  const nomeAluno = localStorage.getItem("aluno_nome") || "Maria Eduarda";

  const elNome = document.getElementById("nomeEstudante");
  const elBoasVindas = document.getElementById("nomeBoasVindas");
  const elAvatar = document.getElementById("avatarInicial");
  const elSaudacao = document.getElementById("saudacaoHora");

  if (elNome) elNome.textContent = nomeAluno;
  if (elBoasVindas) elBoasVindas.textContent = nomeAluno.split(" ")[0];
  if (elAvatar) elAvatar.textContent = nomeAluno.charAt(0).toUpperCase();

  if (elSaudacao) {
    const hora = new Date().getHours();
    let msg = "Olá,";
    if (hora >= 5 && hora < 12) msg = "Bom dia,";
    else if (hora >= 12 && hora < 18) msg = "Boa tarde,";
    else msg = "Boa noite,";
    elSaudacao.textContent = msg;
  }

  const btnSair = document.getElementById("btnSair");
  const modalLogout = document.getElementById("modalLogout");
  const btnCancelarLogout = document.getElementById("btnCancelarLogout");
  const btnConfirmarLogout = document.getElementById("btnConfirmarLogout");

  if (btnSair && modalLogout) {
    
    btnSair.addEventListener("click", () => {
      modalLogout.style.display = "flex";
    });

    if (btnCancelarLogout) {
      btnCancelarLogout.addEventListener("click", () => {
        modalLogout.style.display = "none";
      });
    }

    if (btnConfirmarLogout) {
      btnConfirmarLogout.addEventListener("click", () => {
        localStorage.removeItem("aluno_autenticado");
        window.location.href = "index.html";
      });
    }

    modalLogout.addEventListener("click", (e) => {
      if (e.target === modalLogout) {
        modalLogout.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalLogout.style.display === "flex") {
        modalLogout.style.display = "none";
      }
    });
  }

  inicializarDisciplinas();
  renderizarAvisosUniAteneu();
  configurarFiltros();
  configurarModalDisciplina();

  setTimeout(() => {
    exibirNotificacao(
      "Sessão Conectada",
      `Bem-vinda de volta ao Mundo UniAteneu, ${nomeAluno.split(" ")[0]}!`,
      "success",
      4500
    );
  }, 700);

  setTimeout(() => {
    exibirNotificacao(
      "Lembrete Acadêmico",
      "Entrega do Projeto de IHM encerra hoje às 23h59 via AVA Blackboard.",
      "warning",
      6000
    );
  }, 2800);
}

const DISCIPLINAS_INICIAIS_UNIATENEU = [
  {
    id: 1,
    nome: "Interface Homem-Máquina (IHM)",
    professor: "Profª. Dra. Patrícia Lima",
    nota1: 9.5,
    nota2: 9.0,
    frequencia: 96
  },
  {
    id: 2,
    nome: "Estruturas de Dados e Algoritmos",
    professor: "Prof. Me. Marcos Andrade",
    nota1: 8.5,
    nota2: 8.0,
    frequencia: 92
  },
  {
    id: 3,
    nome: "Programação Web e Dispositivos Móveis",
    professor: "Profª. Camila Torres",
    nota1: 9.5,
    nota2: 9.5,
    frequencia: 98
  },
  {
    id: 4,
    nome: "Engenharia de Requisitos e Software",
    professor: "Prof. Rodrigo Alencar",
    nota1: 7.5,
    nota2: 7.0,
    frequencia: 90
  }
];

function obterDisciplinas() {
  const dados = localStorage.getItem("ateneu_disciplinas");
  if (!dados) {
    localStorage.setItem("ateneu_disciplinas", JSON.stringify(DISCIPLINAS_INICIAIS_UNIATENEU));
    return DISCIPLINAS_INICIAIS_UNIATENEU;
  }
  return JSON.parse(dados);
}

function salvarDisciplinas(lista) {
  localStorage.setItem("ateneu_disciplinas", JSON.stringify(lista));
  renderizarTabelaDisciplinas();
}

let filtroTexto = "";
let filtroStatus = "todas";

function renderizarTabelaDisciplinas() {
  const lista = obterDisciplinas();
  const tbody = document.getElementById("listaDisciplinasBody");
  const statDisciplinas = document.getElementById("statDisciplinas");
  const statMedia = document.getElementById("statMedia");
  const statPresenca = document.getElementById("statPresenca");

  if (!tbody) return;

  tbody.innerHTML = "";

  let somaMedias = 0;
  let somaFreq = 0;

  const filtradas = lista.filter(item => {
    const atendeTexto = item.nome.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                        item.professor.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const media = (Number(item.nota1) + Number(item.nota2)) / 2;
    let situacao = "aprovado";
    if (media < 6.0) situacao = "reprovado";
    else if (media < 7.0) situacao = "cursando";

    let atendeStatus = true;
    if (filtroStatus === "aprovado") atendeStatus = (situacao === "aprovado");
    else if (filtroStatus === "cursando") atendeStatus = (situacao !== "aprovado");

    return atendeTexto && atendeStatus;
  });

  lista.forEach(item => {
    const media = (Number(item.nota1) + Number(item.nota2)) / 2;
    somaMedias += media;
    somaFreq += (item.frequencia || 95);
  });

  if (filtradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhuma disciplina encontrada para o filtro informado.
        </td>
      </tr>
    `;
  } else {
    filtradas.forEach(item => {
      const media = ((Number(item.nota1) + Number(item.nota2)) / 2).toFixed(1);
      const freq = item.frequencia || 95;

      let statusTexto = "Aprovado";
      let statusClass = "badge-aprovado";

      if (media < 6.0) {
        statusTexto = "Reprovado";
        statusClass = "badge-reprovado";
      } else if (media < 7.0) {
        statusTexto = "Em Exame";
        statusClass = "badge-cursando";
      }

      const freqClass = freq < 75 ? "badge-freq alerta" : "badge-freq ok";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="subject-info">
            <span class="subject-name">${item.nome}</span>
            <span class="subject-teacher">${item.professor}</span>
          </div>
        </td>
        <td class="text-center">
          <span class="${freqClass}">${freq}%</span>
        </td>
        <td class="text-center"><strong>${Number(item.nota1).toFixed(1)}</strong></td>
        <td class="text-center"><strong>${Number(item.nota2).toFixed(1)}</strong></td>
        <td class="text-center"><strong style="color: var(--ateneu-blue);">${media}</strong></td>
        <td class="text-center"><span class="badge-status ${statusClass}">${statusTexto}</span></td>
        <td class="text-center">
          <button type="button" class="btn-excluir-disciplina" onclick="removerDisciplina(${item.id})" title="Remover matéria" aria-label="Remover matéria">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (statDisciplinas) statDisciplinas.textContent = lista.length;
  if (statMedia) {
    const mediaTotal = (somaMedias / (lista.length || 1)).toFixed(1);
    statMedia.textContent = mediaTotal;
  }
  if (statPresenca) {
    const mediaPresenca = Math.round(somaFreq / (lista.length || 1));
    statPresenca.textContent = `${mediaPresenca}%`;
  }
}

async function removerDisciplina(id) {
  const lista = obterDisciplinas();
  const disc = lista.find(d => Number(d.id) === Number(id));
  const nomeDisc = disc ? disc.nome : "disciplina";

  const confirmou = confirm(`Deseja realmente remover a matéria "${nomeDisc}"? A alteração será sincronizada no banco de dados.`);
  if (!confirmou) return;

  const novaLista = lista.filter(d => Number(d.id) !== Number(id));
  salvarDisciplinas(novaLista);

  if (typeof bancoRemoverDisciplina === "function") {
    await bancoRemoverDisciplina(id);
  }

  exibirNotificacao("Matéria Removida", `A matéria "${nomeDisc}" foi excluída do sistema e do banco de dados.`, "warning", 4000);
}

window.removerDisciplina = removerDisciplina;

async function inicializarDisciplinas() {
  renderizarTabelaDisciplinas();

  if (typeof bancoBuscarDisciplinas === "function") {
    const matricula = localStorage.getItem("aluno_matricula") || "2026.2.0491";
    const disciplinasDb = await bancoBuscarDisciplinas(matricula);
    if (disciplinasDb && disciplinasDb.length > 0) {
      salvarDisciplinas(disciplinasDb);
    }
  }

  if (typeof bancoBuscarAvisos === "function") {
    const avisosDb = await bancoBuscarAvisos();
    if (avisosDb && avisosDb.length > 0) {
      renderizarAvisosUniAteneu(avisosDb);
    }
  }

  if (typeof escutarMudancasDisciplinas === "function") {
    escutarMudancasDisciplinas((dadosAtualizados, payload) => {
      if (dadosAtualizados && dadosAtualizados.length > 0) {
        salvarDisciplinas(dadosAtualizados);
      } else if (payload && payload.eventType === "DELETE") {
        const idRemovido = payload.old ? payload.old.id : null;
        if (idRemovido) {
          const listaAtual = obterDisciplinas().filter(d => Number(d.id) !== Number(idRemovido));
          salvarDisciplinas(listaAtual);
        }
      }

      let msg = "A grade curricular foi sincronizada em tempo real com o banco de dados.";
      let tipo = "info";
      if (payload) {
        if (payload.eventType === "INSERT") {
          msg = `Nova disciplina "${payload.new ? payload.new.nome : "Adicionada"}" inserida no banco em tempo real.`;
          tipo = "success";
        } else if (payload.eventType === "UPDATE") {
          msg = `Disciplina "${payload.new ? payload.new.nome : "Alterada"}" teve notas/dados modificados no banco.`;
          tipo = "info";
        } else if (payload.eventType === "DELETE") {
          msg = "Uma disciplina foi removida diretamente no banco de dados.";
          tipo = "warning";
        }
      }
      exibirNotificacao("Banco em Tempo Real", msg, tipo, 4500);
    });
  }

  if (typeof escutarMudancasAvisos === "function") {
    escutarMudancasAvisos((dadosAtualizados, payload) => {
      if (dadosAtualizados && dadosAtualizados.length > 0) {
        renderizarAvisosUniAteneu(dadosAtualizados);
      }
      let msg = "Mural de avisos atualizado em tempo real pelo banco de dados.";
      if (payload && payload.new && payload.new.titulo) {
        msg = `Novo comunicado publicado: "${payload.new.titulo}".`;
      }
      exibirNotificacao("Aviso Acadêmico", msg, "info", 4500);
    });
  }

  const matricula = localStorage.getItem("aluno_matricula") || "2026.2.0491";
  if (typeof escutarMudancasAluno === "function") {
    escutarMudancasAluno(matricula, (alunoAtualizado) => {
      if (alunoAtualizado && alunoAtualizado.nome) {
        localStorage.setItem("aluno_nome", alunoAtualizado.nome);
        const elNome = document.getElementById("nomeEstudante");
        const elBoasVindas = document.getElementById("nomeBoasVindas");
        const elAvatar = document.getElementById("avatarInicial");
        if (elNome) elNome.textContent = alunoAtualizado.nome;
        if (elBoasVindas) elBoasVindas.textContent = alunoAtualizado.nome.split(" ")[0];
        if (elAvatar) elAvatar.textContent = alunoAtualizado.nome.charAt(0).toUpperCase();
        exibirNotificacao("Cadastro Acadêmico", "Seus dados de estudante foram atualizados no banco de dados.", "success", 4000);
      }
    });
  }

  if (typeof bancoEstaConectado === "function" && bancoEstaConectado()) {
    exibirNotificacao(
      "Banco Conectado",
      "Sincronização em tempo real ativa com o Supabase (PostgreSQL).",
      "success",
      4000
    );
  }
}

function configurarFiltros() {
  const inputBusca = document.getElementById("filtroDisciplinas");
  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      filtroTexto = e.target.value;
      renderizarTabelaDisciplinas();
    });
  }

  const pills = document.querySelectorAll(".pill-filter");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      filtroStatus = pill.getAttribute("data-filter");
      renderizarTabelaDisciplinas();
    });
  });
}

function configurarModalDisciplina() {
  const modal = document.getElementById("modalDisciplina");
  const btnAbrir = document.getElementById("btnAbrirModalDisciplina");
  const btnFechar = document.getElementById("btnFecharModal");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const form = document.getElementById("formNovaDisciplina");

  if (!modal || !btnAbrir) return;

  const abrir = () => { modal.style.display = "flex"; };
  const fechar = () => {
    modal.style.display = "none";
    form.reset();
  };

  btnAbrir.addEventListener("click", abrir);
  btnFechar.addEventListener("click", fechar);
  btnCancelar.addEventListener("click", fechar);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeDisciplinaInput").value.trim();
    const professor = document.getElementById("professorInput").value.trim();
    const nota1 = parseFloat(document.getElementById("nota1Input").value);
    const nota2 = parseFloat(document.getElementById("nota2Input").value);
    const frequencia = parseInt(document.getElementById("frequenciaInput").value) || 95;

    if (!nome || !professor || isNaN(nota1) || isNaN(nota2)) {
      exibirNotificacao(
        "Campos Incompletos",
        "Por favor, preencha todos os campos da disciplina com notas válidas (0 a 10).",
        "danger",
        4000
      );
      return;
    }

    const novaDisciplina = {
      id: Date.now(),
      aluno_matricula: localStorage.getItem("aluno_matricula") || "2026.2.0491",
      nome,
      professor,
      nota1,
      nota2,
      frequencia
    };

    if (typeof bancoAdicionarDisciplina === "function") {
      const resultadoDb = await bancoAdicionarDisciplina(novaDisciplina);
      if (resultadoDb && resultadoDb.id) {
        novaDisciplina.id = resultadoDb.id;
      }
    }

    const lista = obterDisciplinas();
    const jaExiste = lista.some(d => d.id === novaDisciplina.id);
    if (!jaExiste) {
      lista.push(novaDisciplina);
      salvarDisciplinas(lista);
    }

    fechar();

    exibirNotificacao(
      "Disciplina Cadastrada!",
      `A matéria "${nome}" foi incluída na sua grade curricular e sincronizada no banco de dados.`,
      "success",
      4500
    );
  });
}

const AVISOS_UNIATENEU = [
  {
    id: 1,
    tag: "Urgente",
    tipo: "urgente",
    data: "Hoje, 10:30",
    titulo: "Entrega do Projeto Prático de IHM",
    texto: "A entrega dos arquivos do projeto prático de Interface Homem-Máquina (HTML, CSS e JavaScript) deverá ser realizada até as 23h59 via AVA Blackboard."
  },
  {
    id: 2,
    tag: "Secretaria",
    tipo: "padrao",
    data: "Ontem, 16:45",
    titulo: "Renovação e Matrícula 2027.1",
    texto: "O período oficial de rematrícula para alunos veteranos dos cursos de TI e ADS iniciará no dia 01 de Dezembro com condições exclusivas."
  },
  {
    id: 3,
    tag: "Carreiras",
    tipo: "padrao",
    data: "21 Nov, 14:00",
    titulo: "Vagas de Estágio em Desenvolvimento Web",
    texto: "O Núcleo de Empregabilidade UniAteneu disponibilizou 8 novas vagas para estágio em Frontend e Suporte Técnico em empresas parceiras."
  }
];

function renderizarAvisosUniAteneu(avisosCustom = null) {
  const container = document.getElementById("listaAvisos");
  const statAvisos = document.getElementById("statAvisos");

  if (!container) return;

  const lista = avisosCustom && avisosCustom.length > 0 ? avisosCustom : AVISOS_UNIATENEU;

  container.innerHTML = "";
  lista.forEach(aviso => {
    const item = document.createElement("article");
    item.className = `notice-card ${aviso.tipo === "urgente" ? "urgente" : ""}`;
    item.innerHTML = `
      <div class="notice-meta">
        <span class="notice-tag ${aviso.tipo === "urgente" ? "urgente" : ""}">${aviso.tag}</span>
        <span class="notice-date">${aviso.data}</span>
      </div>
      <h4 class="notice-title">${aviso.titulo}</h4>
      <p class="notice-body">${aviso.texto}</p>
    `;
    container.appendChild(item);
  });

  if (statAvisos) {
    statAvisos.textContent = AVISOS_UNIATENEU.length;
  }
}

window.exibirAvisoServico = function(servico) {
  exibirNotificacao(
    "Serviço Acadêmico",
    `Acessando o serviço "${servico}". Redirecionamento seguro em andamento...`,
    "info",
    3500
  );
};

function exibirNotificacao(titulo, mensagem, tipo = "info", duracao = 4500) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  let icone = "ℹ️";
  if (tipo === "success") icone = "✅";
  else if (tipo === "warning") icone = "⚠️";
  else if (tipo === "danger") icone = "❌";

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <div class="toast-icon">${icone}</div>
    <div class="toast-body">
      <h5 class="toast-title">${titulo}</h5>
      <p class="toast-message">${mensagem}</p>
    </div>
    <button type="button" class="toast-close" aria-label="Fechar notificação">&times;</button>
    <div class="toast-progress" style="animation-duration: ${duracao}ms;"></div>
  `;

  container.appendChild(toast);

  let tempoRestante = duracao;
  let timerId = null;
  let tempoInicio = Date.now();

  const removerToast = () => {
    toast.classList.add("toast-hiding");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 350);
  };

  const iniciarTimer = (tempo) => {
    tempoInicio = Date.now();
    timerId = setTimeout(removerToast, tempo);
  };

  iniciarTimer(duracao);

  toast.addEventListener("mouseenter", () => {
    clearTimeout(timerId);
    tempoRestante -= (Date.now() - tempoInicio);
    const barra = toast.querySelector(".toast-progress");
    if (barra) barra.style.animationPlayState = "paused";
  });

  toast.addEventListener("mouseleave", () => {
    iniciarTimer(Math.max(tempoRestante, 1000));
    const barra = toast.querySelector(".toast-progress");
    if (barra) barra.style.animationPlayState = "running";
  });

  const btnClose = toast.querySelector(".toast-close");
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      clearTimeout(timerId);
      removerToast();
    });
  }
}

window.exibirNotificacao = exibirNotificacao;
