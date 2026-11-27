let clienteSupabase = null;

function obterUsuariosLocais() {
  const salvos = localStorage.getItem("ateneu_usuarios_cadastrados");
  if (!salvos) return [];
  try {
    return JSON.parse(salvos);
  } catch (e) {
    return [];
  }
}

function salvarUsuariosLocais(lista) {
  localStorage.setItem("ateneu_usuarios_cadastrados", JSON.stringify(lista));
}

function obterClienteSupabase() {
  if (clienteSupabase) return clienteSupabase;
  
  if (typeof supabase !== "undefined" && typeof SUPABASE_CONFIG !== "undefined") {
    const { url, anonKey } = SUPABASE_CONFIG;
    if (url && anonKey && url.startsWith("http") && !url.includes("SEU_PROJETO")) {
      try {
        clienteSupabase = supabase.createClient(url, anonKey, {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        return clienteSupabase;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function bancoEstaConectado() {
  return obterClienteSupabase() !== null;
}

async function bancoAutenticarUsuario(identificador, senha) {
  const idFormatado = identificador.trim().toLowerCase();
  const db = obterClienteSupabase();

  if ((idFormatado === "admin@ads.com" || idFormatado === "admin" || idFormatado === "coordenacao") && senha === "123456") {
    return {
      sucesso: true,
      usuario: {
        id: "usr-admin-master",
        nome: "Coordenação Acadêmica",
        matricula: "ADM.2026.01",
        email: "admin@ads.com",
        cargo: "admin",
        status: "ativo",
        curso: "Diretoria e Coordenação",
        campus: "Campus Grand Shopping"
      }
    };
  }

  let usuarioEncontrado = null;

  if (db) {
    try {
      const { data: usuarioDb, error: erroUsuario } = await db
        .from("usuarios")
        .select("*")
        .or(`email.ilike.${idFormatado},matricula.eq.${identificador}`)
        .eq("senha", senha)
        .maybeSingle();

      if (!erroUsuario && usuarioDb) {
        usuarioEncontrado = usuarioDb;
      }
    } catch (e) {}

    if (!usuarioEncontrado) {
      try {
        const { data: alunoDb, error: erroAluno } = await db
          .from("alunos")
          .select("*")
          .or(`email.ilike.${idFormatado},matricula.eq.${identificador}`)
          .eq("senha", senha)
          .maybeSingle();

        if (!erroAluno && alunoDb) {
          usuarioEncontrado = {
            ...alunoDb,
            cargo: "aluno",
            status: "ativo"
          };
        }
      } catch (e) {}
    }
  }

  if (!usuarioEncontrado) {
    const cadastrados = obterUsuariosLocais();
    usuarioEncontrado = cadastrados.find(u => 
      (u.email.toLowerCase() === idFormatado || u.matricula === identificador) && u.senha === senha
    );
  }

  if (usuarioEncontrado) {
    if (usuarioEncontrado.status === "pendente" || usuarioEncontrado.cargo === "pendente") {
      return {
        sucesso: false,
        pendente: true,
        erro: "Cadastro em análise: Sua solicitação foi enviada para a Coordenação Geral, que precisa avaliar e definir seu cargo (Aluno ou Professor) para liberar o acesso."
      };
    }

    if (usuarioEncontrado.status === "recusado") {
      return {
        sucesso: false,
        erro: "Sua solicitação de cadastro foi recusada pela Coordenação."
      };
    }

    return {
      sucesso: true,
      usuario: usuarioEncontrado
    };
  }

  return {
    sucesso: false,
    erro: "E-mail, matrícula ou senha incorretos."
  };
}

async function bancoAutenticarAluno(identificador, senha) {
  const res = await bancoAutenticarUsuario(identificador, senha);
  if (res.sucesso) {
    return {
      sucesso: true,
      aluno: res.usuario
    };
  }
  return res;
}

async function bancoListarUsuarios() {
  const db = obterClienteSupabase();
  let todos = [...obterUsuariosLocais()];

  if (db) {
    try {
      const { data, error } = await db
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(dbUser => {
          const idx = todos.findIndex(u => u.matricula === dbUser.matricula);
          if (idx >= 0) {
            todos[idx] = dbUser;
          } else {
            todos.push(dbUser);
          }
        });
      }
    } catch (e) {}

    try {
      const { data: alunosDb, error: erroAlunos } = await db
        .from("alunos")
        .select("*");

      if (!erroAlunos && alunosDb && alunosDb.length > 0) {
        alunosDb.forEach(aluno => {
          if (!todos.some(u => u.matricula === aluno.matricula)) {
            todos.push({
              ...aluno,
              cargo: "aluno",
              status: "ativo"
            });
          }
        });
      }
    } catch (e) {}
  }

  return todos.filter(u => u.status === "ativo" || (u.status !== "pendente" && u.cargo !== "pendente"));
}

async function bancoListarUsuariosPendentes() {
  const db = obterClienteSupabase();
  let todos = [...obterUsuariosLocais()];

  if (db) {
    try {
      const { data, error } = await db
        .from("usuarios")
        .select("*")
        .or("status.eq.pendente,cargo.eq.pendente")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(dbUser => {
          const idx = todos.findIndex(u => u.matricula === dbUser.matricula);
          if (idx >= 0) {
            todos[idx] = dbUser;
          } else {
            todos.push(dbUser);
          }
        });
      }
    } catch (e) {}
  }

  return todos.filter(u => u.status === "pendente" || u.cargo === "pendente");
}

function gerarMatriculaUnica() {
  const ano = new Date().getFullYear();
  const semestre = new Date().getMonth() < 6 ? 1 : 2;
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `${ano}.${semestre}.${aleatorio}`;
}

async function bancoCadastrarUsuario(novoUsuario) {
  const matriculaFinal = novoUsuario.matricula || gerarMatriculaUnica();
  const usuarioCompleto = {
    id: novoUsuario.id || `usr-${Date.now()}`,
    nome: novoUsuario.nome,
    matricula: matriculaFinal,
    email: novoUsuario.email,
    senha: novoUsuario.senha,
    cargo: novoUsuario.cargo || "aluno",
    status: novoUsuario.status || "ativo",
    curso: novoUsuario.curso || "Análise e Desenvolvimento de Sistemas",
    campus: novoUsuario.campus || "Campus Grand Shopping",
    created_at: new Date().toISOString()
  };

  const locais = obterUsuariosLocais();
  const indexExistente = locais.findIndex(u => u.matricula === usuarioCompleto.matricula || u.email.toLowerCase() === usuarioCompleto.email.toLowerCase());
  if (indexExistente >= 0) {
    locais[indexExistente] = usuarioCompleto;
  } else {
    locais.push(usuarioCompleto);
  }
  salvarUsuariosLocais(locais);

  const db = obterClienteSupabase();
  if (db) {
    try {
      await db.from("usuarios").upsert([usuarioCompleto], { onConflict: "matricula" });
      if (usuarioCompleto.cargo === "aluno" && usuarioCompleto.status === "ativo") {
        await db.from("alunos").upsert([{
          nome: usuarioCompleto.nome,
          matricula: usuarioCompleto.matricula,
          email: usuarioCompleto.email,
          senha: usuarioCompleto.senha,
          curso: usuarioCompleto.curso,
          campus: usuarioCompleto.campus
        }], { onConflict: "matricula" });
      }
    } catch (e) {}
  }

  return usuarioCompleto;
}

async function bancoAprovarUsuario(matricula, cargoDefinido) {
  const locais = obterUsuariosLocais();
  const usuario = locais.find(u => u.matricula === matricula);
  if (usuario) {
    usuario.status = "ativo";
    usuario.cargo = cargoDefinido;
    salvarUsuariosLocais(locais);
  }

  const db = obterClienteSupabase();
  if (db) {
    try {
      await db
        .from("usuarios")
        .update({ status: "ativo", cargo: cargoDefinido })
        .eq("matricula", matricula);

      if (cargoDefinido === "aluno" && usuario) {
        await db.from("alunos").upsert([{
          nome: usuario.nome,
          matricula: usuario.matricula,
          email: usuario.email,
          senha: usuario.senha,
          curso: usuario.curso || "Análise e Desenvolvimento de Sistemas",
          campus: usuario.campus || "Campus Grand Shopping"
        }], { onConflict: "matricula" });
      }
    } catch (e) {}
  }

  return true;
}

async function bancoRecusarUsuario(matricula) {
  const locais = obterUsuariosLocais().filter(u => u.matricula !== matricula);
  salvarUsuariosLocais(locais);

  const db = obterClienteSupabase();
  if (db) {
    try {
      await db.from("usuarios").delete().eq("matricula", matricula);
    } catch (e) {}
  }
  return true;
}

async function bancoRemoverUsuario(matricula) {
  const locais = obterUsuariosLocais().filter(u => u.matricula !== matricula);
  salvarUsuariosLocais(locais);

  const db = obterClienteSupabase();
  if (db) {
    try {
      await db.from("usuarios").delete().eq("matricula", matricula);
      await db.from("alunos").delete().eq("matricula", matricula);
    } catch (e) {}
  }
  return true;
}

async function bancoBuscarDisciplinas(matricula = "2026.2.0491") {
  const db = obterClienteSupabase();
  if (!db) {
    return null;
  }

  try {
    const { data, error } = await db
      .from("disciplinas")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data;
  } catch (e) {
    return null;
  }
}

async function bancoAdicionarDisciplina(disciplina) {
  const db = obterClienteSupabase();
  if (!db) {
    return null;
  }

  try {
    const payload = {
      aluno_matricula: disciplina.aluno_matricula || "2026.2.0491",
      nome: disciplina.nome,
      professor: disciplina.professor,
      nota1: Number(disciplina.nota1) || 0,
      nota2: Number(disciplina.nota2) || 0,
      frequencia: Number(disciplina.frequencia) || 100
    };

    const { data, error } = await db
      .from("disciplinas")
      .insert([payload])
      .select();

    if (error) {
      return null;
    }

    return data && data[0] ? data[0] : payload;
  } catch (e) {
    return null;
  }
}

async function bancoAtualizarDisciplina(id, campos) {
  const db = obterClienteSupabase();
  if (!db) {
    return null;
  }

  try {
    const { data, error } = await db
      .from("disciplinas")
      .update(campos)
      .eq("id", id)
      .select();

    if (error) {
      return null;
    }

    return data && data[0] ? data[0] : null;
  } catch (e) {
    return null;
  }
}

async function bancoRemoverDisciplina(id) {
  const db = obterClienteSupabase();
  if (!db) {
    return false;
  }

  try {
    const { error } = await db
      .from("disciplinas")
      .delete()
      .eq("id", id);

    return !error;
  } catch (e) {
    return false;
  }
}

async function bancoBuscarAvisos() {
  const db = obterClienteSupabase();
  if (!db) {
    return null;
  }

  try {
    const { data, error } = await db
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data;
  } catch (e) {
    return null;
  }
}

async function bancoAdicionarAviso(aviso) {
  const db = obterClienteSupabase();
  if (!db) return null;

  try {
    const payload = {
      titulo: aviso.titulo,
      texto: aviso.texto,
      tag: aviso.tag || "Geral",
      tipo: aviso.tipo || "padrao",
      data: aviso.data || "Hoje, " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    const { data, error } = await db
      .from("avisos")
      .insert([payload])
      .select();

    if (error) return null;
    return data && data[0] ? data[0] : payload;
  } catch (e) {
    return null;
  }
}

async function bancoRemoverAviso(id) {
  const db = obterClienteSupabase();
  if (!db) return false;

  try {
    const { error } = await db
      .from("avisos")
      .delete()
      .eq("id", id);

    return !error;
  } catch (e) {
    return false;
  }
}

let canalDisciplinas = null;
function escutarMudancasDisciplinas(aoMudar) {
  const db = obterClienteSupabase();
  if (!db) return null;

  if (canalDisciplinas) {
    canalDisciplinas.unsubscribe();
  }

  canalDisciplinas = db
    .channel("canal-realtime-disciplinas")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "disciplinas" },
      async (payload) => {
        const dadosAtualizados = await bancoBuscarDisciplinas();
        if (typeof aoMudar === "function") {
          aoMudar(dadosAtualizados, payload);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        window.dispatchEvent(new CustomEvent("supabase:realtime:disciplinas", { detail: { status: "conectado" } }));
      }
    });

  return canalDisciplinas;
}

let canalAvisos = null;
function escutarMudancasAvisos(aoMudar) {
  const db = obterClienteSupabase();
  if (!db) return null;

  if (canalAvisos) {
    canalAvisos.unsubscribe();
  }

  canalAvisos = db
    .channel("canal-realtime-avisos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "avisos" },
      async (payload) => {
        const dadosAtualizados = await bancoBuscarAvisos();
        if (typeof aoMudar === "function") {
          aoMudar(dadosAtualizados, payload);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        window.dispatchEvent(new CustomEvent("supabase:realtime:avisos", { detail: { status: "conectado" } }));
      }
    });

  return canalAvisos;
}

let canalUsuarios = null;
function escutarMudancasUsuarios(aoMudar) {
  const db = obterClienteSupabase();
  if (!db) return null;

  if (canalUsuarios) {
    canalUsuarios.unsubscribe();
  }

  canalUsuarios = db
    .channel("canal-realtime-usuarios")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "usuarios" },
      async (payload) => {
        const dadosAtualizados = await bancoListarUsuarios();
        const pendentesAtualizados = await bancoListarUsuariosPendentes();
        if (typeof aoMudar === "function") {
          aoMudar(dadosAtualizados, pendentesAtualizados, payload);
        }
      }
    )
    .subscribe();

  return canalUsuarios;
}

let canalAluno = null;
function escutarMudancasAluno(matricula, aoMudar) {
  const db = obterClienteSupabase();
  if (!db) return null;

  if (canalAluno) {
    canalAluno.unsubscribe();
  }

  canalAluno = db
    .channel("canal-realtime-aluno")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "alunos" },
      (payload) => {
        if (payload && payload.new && payload.new.matricula === matricula) {
          if (typeof aoMudar === "function") {
            aoMudar(payload.new, payload);
          }
        }
      }
    )
    .subscribe();

  return canalAluno;
}

window.bancoEstaConectado = bancoEstaConectado;
window.bancoAutenticarUsuario = bancoAutenticarUsuario;
window.bancoAutenticarAluno = bancoAutenticarAluno;
window.bancoListarUsuarios = bancoListarUsuarios;
window.bancoListarUsuariosPendentes = bancoListarUsuariosPendentes;
window.bancoCadastrarUsuario = bancoCadastrarUsuario;
window.bancoAprovarUsuario = bancoAprovarUsuario;
window.bancoRecusarUsuario = bancoRecusarUsuario;
window.bancoRemoverUsuario = bancoRemoverUsuario;
window.bancoBuscarDisciplinas = bancoBuscarDisciplinas;
window.bancoAdicionarDisciplina = bancoAdicionarDisciplina;
window.bancoAtualizarDisciplina = bancoAtualizarDisciplina;
window.bancoRemoverDisciplina = bancoRemoverDisciplina;
window.bancoBuscarAvisos = bancoBuscarAvisos;
window.bancoAdicionarAviso = bancoAdicionarAviso;
window.bancoRemoverAviso = bancoRemoverAviso;
window.escutarMudancasDisciplinas = escutarMudancasDisciplinas;
window.escutarMudancasAvisos = escutarMudancasAvisos;
window.escutarMudancasUsuarios = escutarMudancasUsuarios;
window.escutarMudancasAluno = escutarMudancasAluno;
