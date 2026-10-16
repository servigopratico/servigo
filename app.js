console.log("TESTE DIRETO DO ARQUIVO APP.JS");
console.log("APP.JS ATUALIZADO FOI CARREGADO");
const SUPABASE_URL = "https://gotjhovwzkbxdkrpbfcw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gC_SCy0teZKtW6TBbmxDCA_NdG5J1Uc";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

var servicoAtual = null;

window.atualizarBotoesServico = function(status) {
    console.log("Atualizando botões. Status:", status);

    var btnAceitar = document.getElementById("btnAceitar");
    var btnIniciar = document.getElementById("btnIniciar");
    var btnFinalizar = document.getElementById("btnFinalizar");

    if (btnAceitar) {
        btnAceitar.style.display =
            status === "Aguardando aceite" ? "block" : "none";
    }

    if (btnIniciar) {
        btnIniciar.style.display =
            status === "Aceito" ? "block" : "none";
    }

    if (btnFinalizar) {
        btnFinalizar.style.display =
            status === "Em andamento" ? "block" : "none";
    }
};

supabaseClient.auth.getSession().then(function(resultado) {
    console.log("Sessão atual:", resultado.data.session);
});
var servicoAtual = null;
window.atualizarBotoesServico = function(status) {
    console.log("Atualizando botões. Status:", status);

    var btnAceitar = document.getElementById("btnAceitar");
    var btnIniciar = document.getElementById("btnIniciar");
    var btnFinalizar = document.getElementById("btnFinalizar");

    if (btnAceitar) {
        btnAceitar.style.display =
            status === "Aguardando aceite" ? "block" : "none";
    }

    if (btnIniciar) {
        btnIniciar.style.display =
            status === "Aceito" ? "block" : "none";
    }

    if (btnFinalizar) {
        btnFinalizar.style.display =
            status === "Em andamento" ? "block" : "none";
    }
};

console.log("CHEGUEI ANTES DA FUNÇÃO ABRIR");

function abrir(tela) {
    document.querySelectorAll(".tela").forEach(function(item) {
        item.classList.remove("ativa");
    });

    var telaSelecionada = document.getElementById(tela);
    if (telaSelecionada) {
        telaSelecionada.classList.add("ativa");
    }

    if (tela === "painelEntregador") {
        console.log("Painel do entregador aberto");
        carregarServico();
        console.log("Serviço atual:", servicoAtual);
        atualizarBotoesServico(servicoAtual ? servicoAtual.status : null);
    }

    if (tela === "mapa") {
        console.log("Mapa aberto");
        inicializarMapa();
        carregarServicosNoMapa();
        setTimeout(function() {
            if (mapa) mapa.invalidateSize();
        }, 300);
    }
}

window.abrir = abrir;

async function criarServico(event) {
    event.preventDefault();

    try {
        // 1. Identificar a empresa logada
        const empresa = await obterEmpresaLogada();

        if (!empresa || !empresa.id) {
            alert("Faça login na empresa antes de criar um serviço.");
            return;
        }

        // 2. Ler o entregador aprovado selecionado (ou deixar sem atribuição)
        const entregadorSelecionado =
            document.getElementById("entregadorSelecionado").value;
        let entregadorId = null;
        let nomeEntregador = "Aguardando entregador";

        if (entregadorSelecionado) {
            const { data: entregador, error: erroEntregador } = await supabaseClient
                .from("entregadores")
                .select("id,nome")
                .eq("id", entregadorSelecionado)
                .eq("status_aprovacao", "aprovado")
                .maybeSingle();

            if (erroEntregador || !entregador) {
                console.error("Erro ao buscar entregador aprovado:", erroEntregador);
                alert("O entregador selecionado não está disponível ou não foi aprovado.");
                return;
            }
            entregadorId = entregador.id;
            nomeEntregador = entregador.nome;
        }

        // 3. Garantir um número de serviço único para esta empresa.
        const campoNumero = document.getElementById("numero");
        let numeroServico = campoNumero ? campoNumero.value.trim() : "";

        // Consultar os números já usados por esta empresa.
        const { data: servicosExistentes, error: erroNumeros } = await supabaseClient
            .from("servicos")
            .select("numero")
            .eq("empresa_id", empresa.id);

        if (erroNumeros) {
            console.error("Erro ao verificar números existentes:", erroNumeros);
            alert("Não foi possível verificar os números dos serviços. Tente novamente.");
            return;
        }

        const numerosUsados = (servicosExistentes || [])
            .map(item => String(item.numero || "").trim())
            .filter(Boolean);

        if (!numeroServico) {
            // Se o campo estiver vazio, gerar o próximo número após o maior número inteiro existente.
            const numerosNumericos = numerosUsados
                .map(valor => Number(valor))
                .filter(valor => Number.isSafeInteger(valor) && valor > 0);
            numeroServico = String(Math.max(1000, ...numerosNumericos) + 1);
            if (campoNumero) campoNumero.value = numeroServico;
        } else if (numerosUsados.includes(numeroServico)) {
            alert("O número " + numeroServico + " já existe para esta empresa. Escolha outro número para evitar duplicidade.");
            if (campoNumero) {
                campoNumero.focus();
                campoNumero.select();
            }
            return;
        }

        // 4. Preparar os dados do serviço
        const novoServico = {
            empresa_id: empresa.id,
            entregador_id: entregadorId,
            status_id: 1,
            descricao: "Serviço nº " + numeroServico,
            numero: numeroServico,
            endereco_coleta:
                document.getElementById("coleta").value.trim(),
            endereco_entrega:
                document.getElementById("destino").value.trim(),
            destinatario:
                document.getElementById("destinatario").value.trim(),
            observacoes:
                document.getElementById("observacoes").value.trim()
        };

        // 4. Gravar no Supabase
const { data, error } = await supabaseClient
    .from("servicos")
    .insert(novoServico)
    .select("id")
    .single();
        if (error) {
            console.error("Erro ao salvar serviço:", error);
            alert("Não foi possível salvar o serviço: " + error.message);
            return;
        }

        // 5. Atualizar a visualização local
        servicoAtual = {
            id: data.id,
            numero: novoServico.numero,
            coleta: novoServico.endereco_coleta,
            destino: novoServico.endereco_entrega,
            destinatario: novoServico.destinatario,
            entregador: nomeEntregador,
            observacoes: novoServico.observacoes,
            status: "Aguardando aceite"
        };

        atualizarServico();
        atualizarEmpresa();

        // 6. Confirmar o cadastro
        alert("Serviço criado e salvo no Supabase com sucesso!");

        abrir("empresa");

    } catch (erro) {
        console.error("Erro inesperado:", erro);
        alert("Ocorreu um erro ao criar o serviço.");
    }
}

function atualizarServico() {

    if (!servicoAtual) {
        return;
    }

    var servico =
        document.getElementById("servico");

    if (!servico) {
        return;
    }

    servico.innerHTML =

        "<strong>📦 Serviço #" +
        servicoAtual.numero +
        "</strong><br><br>" +

        "📍 <strong>Coleta:</strong> " +
        servicoAtual.coleta +
        "<br>" +

        "📍 <strong>Destino:</strong> " +
        servicoAtual.destino +
        "<br>" +

        "👤 <strong>Destinatário:</strong> " +
        servicoAtual.destinatario +
        "<br>" +

        "🛵 <strong>Entregador:</strong> " +
        servicoAtual.entregador +
        "<br><br>" +

        "📌 <strong>Status:</strong> " +
        servicoAtual.status;
    if (servicoAtual.observacoes) {

        servico.innerHTML +=
            "<br><br>📝 <strong>Observações:</strong> " +
            servicoAtual.observacoes;
    }

    atualizarBotoesServico(servicoAtual.status);
}

function atualizarBotoesServico(status) {
    console.log("Atualizando botões. Status:", status);

    var btnAceitar = document.getElementById("btnAceitar");
    var btnIniciar = document.getElementById("btnIniciar");
    var btnFinalizar = document.getElementById("btnFinalizar");

    if (btnAceitar) {
        btnAceitar.style.display =
            status === "Aguardando aceite" ? "block" : "none";
    }

    if (btnIniciar) {
        btnIniciar.style.display =
            status === "Aceito" ? "block" : "none";
    }

    if (btnFinalizar) {
        btnFinalizar.style.display =
            status === "Em andamento" ? "block" : "none";
    }
}
async function atualizarStatusServico(novoStatusId, textoStatus) {
    if (!servicoAtual || !servicoAtual.id) {
        alert("Serviço sem ID do Supabase. Crie ou carregue o serviço novamente.");
        return false;
    }

    const { error } = await supabaseClient
        .from("servicos")
        .update({ status_id: novoStatusId })
        .eq("id", servicoAtual.id);

    if (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Não foi possível atualizar o serviço: " + error.message);
        return false;
    }

    servicoAtual.status = textoStatus;
salvarServico();

atualizarServico();
atualizarBotoesServico(servicoAtual.status);

await atualizarEmpresa();

return true;
}

async function aceitar() {
    carregarServico();

    if (!servicoAtual) {
        alert("Nenhum serviço disponível.");
        return;
    }

    if (servicoAtual.status !== "Aguardando aceite") {
        alert("Este serviço já está como: " + servicoAtual.status);
        return;
    }

    const sucesso = await atualizarStatusServico(2, "Aceito");

    if (sucesso) {
        alert("✅ Serviço aceito e atualizado no Supabase!");
    }
}

async function iniciar() {
    carregarServico();

    if (!servicoAtual) {
        alert("Nenhum serviço disponível.");
        return;
    }

    if (servicoAtual.status !== "Aceito") {
        alert("Primeiro é necessário aceitar o serviço.");
        return;
    }

    const sucesso = await atualizarStatusServico(3, "Em andamento");

    if (sucesso) {
        alert("▶️ Serviço iniciado e atualizado no Supabase!");
    }
}

async function finalizar() {
    carregarServico();

    if (!servicoAtual) {
        alert("Nenhum serviço disponível.");
        return;
    }

    if (servicoAtual.status !== "Em andamento") {
        alert("O serviço precisa estar em andamento para ser finalizado.");
        return;
    }

    const sucesso = await atualizarStatusServico(4, "Concluído");

    if (sucesso) {
        alert("🏁 Serviço concluído e atualizado no Supabase!");
    }
}


async function atualizarEmpresa() {
    const ativos = document.getElementById("ativos");
    const concluidos = document.getElementById("concluidos");
    const listaServicos = document.getElementById("listaServicos");

    if (ativos) ativos.textContent = "...";
    if (concluidos) concluidos.textContent = "...";

    if (listaServicos) {
        listaServicos.textContent = "Carregando serviços...";
    }

    try {
        const empresa = await obterEmpresaLogada();

        if (!empresa || !empresa.id) {
            throw new Error("Empresa não encontrada.");
        }

        // Buscar os serviços da empresa no Supabase
        const { data: lista, error } = await supabaseClient
            .from("servicos")
            .select(`
                id,
                numero,
                descricao,
                endereco_coleta,
                endereco_entrega,
                destinatario,
                observacoes,
                status_id,
                entregador_id,
                created_at
            `)
            .eq("empresa_id", empresa.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        const servicos = lista || [];

        // Contar serviços ativos e concluídos
        const totalConcluidos = servicos.filter(
            servico => Number(servico.status_id) === 4
        ).length;

        const totalAtivos = servicos.filter(
            servico =>
                Number(servico.status_id) !== 4 &&
                Number(servico.status_id) !== 5
        ).length;

        if (ativos) ativos.textContent = totalAtivos;
        if (concluidos) concluidos.textContent = totalConcluidos;

        // Buscar nomes dos entregadores
        const { data: entregadores, error: erroEntregadores } =
            await supabaseClient
                .from("entregadores")
                .select("id, nome");

const totalEntregadores = (entregadores || []).length;

const elementoEntregadores =
    document.getElementById("totalEntregadores");

if (elementoEntregadores) {
    elementoEntregadores.textContent = totalEntregadores;
}

        if (erroEntregadores) {
            console.error("Erro ao buscar entregadores:", erroEntregadores);
        }

        const nomesEntregadores = {};

        (entregadores || []).forEach(entregador => {
            nomesEntregadores[entregador.id] = entregador.nome;
        });

        // Mostrar a lista de serviços no painel
        if (listaServicos) {
            listaServicos.innerHTML = "";

            if (servicos.length === 0) {
                listaServicos.textContent = "Nenhum serviço cadastrado.";
            }

            servicos.forEach(servico => {
                const cartao = document.createElement("div");
                cartao.className = "servico-item";

                const titulo = document.createElement("h4");
                titulo.textContent =
                    "📦 Serviço #" + (servico.numero || "Sem número");

                const coleta = document.createElement("p");
                coleta.textContent =
                    "📍 Coleta: " + (servico.endereco_coleta || "-");

                const destino = document.createElement("p");
                destino.textContent =
                    "📍 Destino: " + (servico.endereco_entrega || "-");

                const destinatario = document.createElement("p");
                destinatario.textContent =
                    "👤 Destinatário: " + (servico.destinatario || "-");

                const entregador = document.createElement("p");
                entregador.textContent =
                    "🛵 Entregador: " +
                    (nomesEntregadores[servico.entregador_id] ||
                     "Não identificado");

                const statusNomes = {
                    1: "Aguardando aceite",
                    2: "Aceito",
                    3: "Em andamento",
                    4: "Concluído",
                    5: "Cancelado"
                };

                const status = document.createElement("p");
                status.textContent =
                    "📌 Status: " +
                    (statusNomes[Number(servico.status_id)] ||
                     "Desconhecido");

                cartao.appendChild(titulo);
                cartao.appendChild(coleta);
                cartao.appendChild(destino);
                cartao.appendChild(destinatario);
                cartao.appendChild(entregador);
                cartao.appendChild(status);

                if (servico.observacoes) {
                    const observacoes = document.createElement("p");
                    observacoes.textContent =
                        "📝 Observações: " + servico.observacoes;
                    cartao.appendChild(observacoes);
                }

                listaServicos.appendChild(cartao);
            });
        }

        console.log("Serviços carregados:", servicos);

    } catch (erro) {
        console.error("Erro ao atualizar painel da empresa:", erro);

        if (ativos) ativos.textContent = "Erro";
        if (concluidos) concluidos.textContent = "Erro";

        if (listaServicos) {
            listaServicos.textContent =
                "Não foi possível carregar os serviços.";
        }
    }
}
async function testarSupabase() {
    const { data, error } = await supabaseClient
        .from("status_servicos")
        .select("id, nome")
        .order("id");

    if (error) {
        console.error("Erro ao conectar ao Supabase:", error);
        alert("❌ Erro na conexão com o Supabase. Veja o Console.");
        return;
    }

    console.log("✅ Supabase conectado!");
    console.log("Status encontrados:", data);

    alert(
        "✅ Supabase conectado com sucesso!\n\n" +
        "Status encontrados: " + data.length
    );
}


async function loginEmpresa(event) {

    event.preventDefault();

    var email = document.getElementById("emailEmpresa").value;	
    var senha = document.getElementById("senhaEmpresa").value;

    var resultado = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (resultado.error) {

        console.error(resultado.error);

        alert("Erro ao entrar: " + resultado.error.message);

        return;
    }

    alert("✅ Login realizado com sucesso!");

    abrir("empresa");
}

testarSupabase();
async function obterEmpresaLogada() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();

    if (erroUsuario || !user) {
        console.error("Usuário não autenticado:", erroUsuario);
        return null;
    }

    const { data: empresa, error: erroEmpresa } =
        await supabaseClient
            .from("empresas")
            .select("id")
            .eq("usuario_id", user.id)
            .single();

    if (erroEmpresa) {
      console.error("ERRO COMPLETO EMPRESA:", JSON.stringify(erroEmpresa, null, 2));
    }

    console.log("✅ Empresa logada:", empresa);

    return empresa;
}

obterEmpresaLogada();

var mapa = null;

function inicializarMapa() {
    var elemento = document.getElementById("map");

    if (!elemento || typeof L === "undefined") {
        console.error("Mapa ou Leaflet não disponível.");
        return;
    }

    if (mapa) {
        mapa.invalidateSize();
        return;
    }

    mapa = L.map(elemento).setView(
        [-23.5505, -46.6333],
        11
    );

    L.tileLayer(
        "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=ifOIDxQkpaUlCvEXiSa4",
        {
            attribution:
                '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap contributors',
            maxZoom: 19
        }
    ).addTo(mapa);
}

window.inicializarMapa = inicializarMapa;

async function carregarServicosNoMapa() {

    console.log("Carregando serviços no mapa...");

    const { data: servicos, error } = await supabaseClient
        .from("servicos")
        .select(`
            id,
            numero,
            endereco_coleta,
            endereco_entrega,
            latitude_coleta,
            longitude_coleta,
            latitude_entrega,
            longitude_entrega,
            status_id
     
        `)
        .not("status_id", "in", "(4,5)");

    if (error) {
        console.error("Erro ao carregar serviços para o mapa:", error);
        return;
    }

    console.log("Serviços encontrados para o mapa:", servicos);

    for (const servico of servicos) {

        if (!servico.endereco_coleta) {
            continue;
        }

        if (
            servico.latitude_coleta != null &&
            servico.longitude_coleta != null
        ) {
            L.marker([
                Number(servico.latitude_coleta),
                Number(servico.longitude_coleta)
            ])
            .addTo(mapa)
            .bindPopup("Serviço #" + servico.numero);

            continue;
        }

        try {

            const endereco = servico.endereco_coleta +
                ", São Paulo, SP, Brasil";

            const url =
                "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
                encodeURIComponent(endereco);

            const resposta = await fetch(url);
            const resultados = await resposta.json();

            if (!resultados.length) {
                console.warn(
                    "Endereço não localizado:",
                    servico.endereco_coleta
                );
                continue;
            }

            const latitude = Number(resultados[0].lat);
            const longitude = Number(resultados[0].lon);

          
L.marker([latitude, longitude])
    .addTo(mapa)
    .bindPopup(
        "<strong>Serviço #" + servico.numero + "</strong>" +
        "<br><br><strong>Coleta:</strong> " +
        (servico.endereco_coleta || "Não informado") +
        "<br><br><strong>Entrega:</strong> " +
        (servico.endereco_entrega || "Não informado")
    );

            const { error: erroAtualizacao } = await supabaseClient
                .from("servicos")
                .update({
                    latitude_coleta: latitude,
                    longitude_coleta: longitude
                })
                .eq("id", servico.id);

            if (erroAtualizacao) {
                console.error(
                    "Erro ao salvar coordenadas:",
                    erroAtualizacao
                );
            } else {
                console.log(
                    "Coordenadas salvas para o serviço:",
                    servico.numero
                );
            }

        } catch (erro) {
            console.error(
                "Erro ao localizar endereço:",
                servico.endereco_coleta,
                erro
            );
        }

    }

}

/* ===== MÓDULO DE CADASTRO, LOGIN E APROVAÇÃO DE ENTREGADORES ===== */

function valorCampo(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function mostrarMensagem(texto) {
    alert(texto);
}

window.abrir = function(tela) {
    document.querySelectorAll(".tela").forEach(function(item) {
        item.classList.remove("ativa");
    });

    const destino = document.getElementById(tela);

    if (destino) {
        destino.classList.add("ativa");
    }

    if (tela === "empresa") {
        atualizarEmpresa();
        carregarEntregadoresAprovados();
    }

    if (tela === "painelEntregador") {
        verificarAcessoEntregador();
    }

    if (tela === "admin") {
        carregarCadastrosPendentes();
    }


if (tela === "mapa") {
    console.log("Mapa aberto");

    if (typeof L === "undefined") {
        console.error("Leaflet não foi carregado.");
        alert("O mapa não foi carregado. Confira a conexão com a internet.");
        return;
    }

    inicializarMapa();

    if (!mapa) {
        console.error("Não foi possível inicializar o mapa.");
        return;
    }

    setTimeout(async function() {
        mapa.invalidateSize();
        await carregarServicosNoMapa();
    }, 300);
}

};
async function cadastrarEntregador(event) {
    event.preventDefault();

    const email = valorCampo("cadEmail");
    const senha = valorCampo("cadSenha");
    const nome = valorCampo("cadNome");
    const telefone = valorCampo("cadTelefone");
    const veiculo = valorCampo("cadVeiculo");
    const placa = valorCampo("cadPlaca");

    const arquivoDocumento = document.getElementById("cadDocumento").files[0];
    const arquivoResidencia = document.getElementById("cadComprovante").files[0];

    if (!arquivoDocumento || !arquivoResidencia) {
        alert("Envie o documento de identificação e o comprovante de residência.");
        return;
    }

    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    let usuarioCriado = null;
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: senha
        });
        if (error) throw error;
        usuarioCriado = data.user;

        if (!usuarioCriado) {
            throw new Error("O Supabase não retornou o usuário. Confira as configurações de autenticação.");
        }

        if (!data.session) {
            alert("Sua conta foi criada, mas o Supabase exige confirmação de e-mail antes de entrar. Confirme o e-mail e depois faça login. Se a confirmação estiver desativada, tente entrar normalmente.");
            return;
        }

        const { data: cadastro, error: erroCadastro } = await supabaseClient
            .from("entregadores")
            .insert({
                usuario_id: usuarioCriado.id,
                nome: nome,
                email: email,
                telefone: telefone,
                veiculo: veiculo,
                placa: placa,
                disponivel: false
            })
            .select("id")
            .single();

        if (erroCadastro) throw erroCadastro;

        const pasta = usuarioCriado.id;
        const nomeDoc = Date.now() + "_" + arquivoDocumento.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const nomeComp = Date.now() + "_residencia_" + arquivoResidencia.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const { error: erroUploadDoc } = await supabaseClient.storage
            .from("documentos-entregadores")
            .upload(pasta + "/" + nomeDoc, arquivoDocumento, { upsert: false });
        if (erroUploadDoc) throw erroUploadDoc;

        const { error: erroUploadComp } = await supabaseClient.storage
            .from("documentos-entregadores")
            .upload(pasta + "/" + nomeComp, arquivoResidencia, { upsert: false });
        if (erroUploadComp) throw erroUploadComp;

        const dadosPrivados = {
            entregador_id: cadastro.id,
            cpf: valorCampo("cadCpf"),
            cep: valorCampo("cadCep"),
            logradouro: valorCampo("cadLogradouro"),
            numero_endereco: valorCampo("cadNumero"),
            complemento: valorCampo("cadComplemento"),
            bairro: valorCampo("cadBairro"),
            cidade: valorCampo("cadCidade"),
            uf: valorCampo("cadUf").toUpperCase(),
            banco: valorCampo("cadBanco"),
            agencia: valorCampo("cadAgencia"),
            conta: valorCampo("cadConta"),
            tipo_conta: valorCampo("cadTipoConta"),
            chave_pix: valorCampo("cadPix"),
            documento_path: pasta + "/" + nomeDoc,
            comprovante_residencia_path: pasta + "/" + nomeComp
        };

        const { error: erroPrivado } = await supabaseClient
            .from("dados_privados_entregadores")
            .insert(dadosPrivados);
        if (erroPrivado) throw erroPrivado;

        document.getElementById("formCadastroEntregador").reset();
        alert("Cadastro enviado! Seu acesso ficará bloqueado até o administrador analisar os documentos.");
        abrir("loginEntregador");
    } catch (erro) {
        console.error("Erro no cadastro do entregador:", erro);
        alert("Não foi possível concluir o cadastro: " + (erro.message || "erro desconhecido") +
            "\n\nSe o usuário foi criado, tente entrar com o mesmo e-mail antes de cadastrar novamente.");
    }
}

async function loginEntregador(event) {
    event.preventDefault();
    const email = valorCampo("loginEntEmail");
    const senha = valorCampo("loginEntSenha");
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });
    if (error) {
        alert("Não foi possível entrar: " + error.message);
        return;
    }

    const { data: admin, error: erroAdmin } = await supabaseClient
        .from("administradores")
        .select("usuario_id")
        .eq("usuario_id", data.user.id)
        .maybeSingle();

    if (!erroAdmin && admin) {
        abrir("admin");
        return;
    }
    abrir("painelEntregador");
}

async function verificarAcessoEntregador() {
    const { data: sessao } = await supabaseClient.auth.getSession();
    if (!sessao.session) {
        alert("Entre com seu e-mail e senha para acessar o painel do entregador.");
        abrir("loginEntregador");
        return;
    }

    const { data: perfil, error } = await supabaseClient
        .from("entregadores")
        .select("id,nome,status_aprovacao,motivo_rejeicao")
        .eq("usuario_id", sessao.session.user.id)
        .maybeSingle();

    if (error || !perfil) {
        alert("Não encontramos um cadastro de entregador para esta conta. Faça seu cadastro ou entre com a conta correta.");
        await supabaseClient.auth.signOut();
        abrir("loginEntregador");
        return;
    }

    if (perfil.status_aprovacao !== "aprovado") {
        const detalhe = perfil.status_aprovacao === "rejeitado"
            ? "\nMotivo: " + (perfil.motivo_rejeicao || "Não informado.")
            : "";
        alert("Seu cadastro ainda não foi aprovado. Você não pode acessar serviços." + detalhe);
        await supabaseClient.auth.signOut();
        abrir("loginEntregador");
        return;
    }

    await carregarServicoDoEntregador(perfil.id);
}

async function carregarServicoDoEntregador(entregadorId) {
    const { data, error } = await supabaseClient
        .from("servicos")
        .select("id,numero,descricao,endereco_coleta,endereco_entrega,destinatario,observacoes,status_id,entregador_id")
        .or("entregador_id.eq." + entregadorId + ",and(entregador_id.is.null,status_id.eq.1)")
        .in("status_id", [1,2,3])
        .order("created_at", { ascending: true })
        .limit(1);

    if (error) {
        console.error("Erro ao carregar serviço do entregador:", error);
        document.getElementById("servico").textContent = "Não foi possível carregar os serviços. Confira a conexão e as permissões do Supabase.";
        return;
    }

    if (!data || !data.length) {
        servicoAtual = null;
        document.getElementById("servico").textContent = "Nenhum serviço disponível para você no momento.";
        atualizarBotoesServico(null);
        return;
    }

    const item = data[0];
    const statusNomes = {1:"Aguardando aceite", 2:"Aceito", 3:"Em andamento", 4:"Concluído", 5:"Cancelado"};
    servicoAtual = {
        id: item.id,
        numero: item.numero || item.descricao || "Sem número",
        coleta: item.endereco_coleta,
        destino: item.endereco_entrega,
        destinatario: item.destinatario,
        observacoes: item.observacoes,
        status: statusNomes[Number(item.status_id)] || "Desconhecido",
        entregador_id: item.entregador_id
    };
    salvarServico();
    atualizarServico();
}

async function aceitar() {
    await mudarStatusServicoEntregador(2, "Aceito");
}
async function iniciar() {
    await mudarStatusServicoEntregador(3, "Em andamento");
}
async function finalizar() {
    await mudarStatusServicoEntregador(4, "Concluído");
}

async function mudarStatusServicoEntregador(novoStatus, texto) {
    const { data: sessao } = await supabaseClient.auth.getSession();
    if (!sessao.session) {
        alert("Faça login como entregador.");
        abrir("loginEntregador");
        return;
    }
    const { data: perfil, error: erroPerfil } = await supabaseClient
        .from("entregadores")
        .select("id,status_aprovacao")
        .eq("usuario_id", sessao.session.user.id)
        .maybeSingle();

    if (erroPerfil || !perfil || perfil.status_aprovacao !== "aprovado") {
        alert("Somente entregadores aprovados podem atualizar serviços.");
        return;
    }

    if (!servicoAtual || !servicoAtual.id) {
        await carregarServicoDoEntregador(perfil.id);
        if (!servicoAtual || !servicoAtual.id) {
            alert("Nenhum serviço disponível.");
            return;
        }
    }

    const atual = servicoAtual.status;
    if (novoStatus === 2 && atual !== "Aguardando aceite") {
        alert("Este serviço não está aguardando aceite.");
        return;
    }
    if (novoStatus === 3 && atual !== "Aceito") {
        alert("Aceite o serviço antes de iniciá-lo.");
        return;
    }
    if (novoStatus === 4 && atual !== "Em andamento") {
        alert("O serviço precisa estar em andamento para ser finalizado.");
        return;
    }

    const atualizacao = { status_id: novoStatus };
    if (novoStatus === 2 && !servicoAtual.entregador_id) {
        atualizacao.entregador_id = perfil.id;
    }
    const { error } = await supabaseClient
        .from("servicos")
        .update(atualizacao)
        .eq("id", servicoAtual.id);

    if (error) {
        console.error("Erro ao atualizar serviço:", error);
        alert("Não foi possível atualizar o serviço: " + error.message);
        return;
    }
    servicoAtual.status = texto;
    servicoAtual.entregador_id = perfil.id;
    salvarServico();
    atualizarServico();
    atualizarBotoesServico(texto);
    alert("Status atualizado: " + texto);
    await carregarServicoDoEntregador(perfil.id);
}

async function carregarEntregadoresAprovados() {
    const select = document.getElementById("entregadorSelecionado");
    if (!select) return;
    const { data, error } = await supabaseClient
        .from("entregadores")
        .select("id,nome")
        .eq("status_aprovacao", "aprovado")
        .eq("disponivel", true)
        .order("nome");
    select.innerHTML = '<option value="">Sem atribuição (qualquer entregador aprovado pode aceitar)</option>';
    if (error) {
        console.error("Erro ao carregar entregadores aprovados:", error);
        return;
    }
    (data || []).forEach(function(entregador) {
        const option = document.createElement("option");
        option.value = entregador.id;
        option.textContent = entregador.nome;
        select.appendChild(option);
    });
}

async function carregarCadastrosPendentes() {
    const lista = document.getElementById("listaPendentes");
    if (!lista) return;
    lista.textContent = "Carregando cadastros...";
    const { data: sessao } = await supabaseClient.auth.getSession();
    if (!sessao.session) {
        alert("Faça login com a conta de administrador.");
        abrir("loginEntregador");
        return;
    }
    const { data: admin, error: erroAdmin } = await supabaseClient
        .from("administradores")
        .select("usuario_id")
        .eq("usuario_id", sessao.session.user.id)
        .maybeSingle();
    if (erroAdmin || !admin) {
        alert("Esta conta não tem permissão de administrador.");
        abrir("inicio");
        return;
    }

    const { data, error } = await supabaseClient
        .from("entregadores")
        .select("id,nome,email,telefone,veiculo,placa,created_at,status_aprovacao")
        .eq("status_aprovacao", "pendente")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Erro ao listar cadastros pendentes:", error);
        lista.textContent = "Não foi possível listar os cadastros. Confira a política de leitura de administradores indicada nas instruções.";
        return;
    }

    lista.innerHTML = "";
    if (!data || !data.length) {
        lista.textContent = "Não há cadastros pendentes.";
        return;
    }

    for (const pessoa of data) {
        const cartao = document.createElement("article");
        cartao.className = "servico";
        const titulo = document.createElement("h3");
        titulo.textContent = pessoa.nome;
        cartao.appendChild(titulo);
        [ "E-mail: " + (pessoa.email || "-"),
          "Telefone: " + (pessoa.telefone || "-"),
          "Veículo: " + (pessoa.veiculo || "-"),
          "Placa: " + (pessoa.placa || "-") ].forEach(function(texto) {
            const p = document.createElement("p");
            p.textContent = texto;
            cartao.appendChild(p);
        });

        const verDados = document.createElement("button");
        verDados.type = "button";
        verDados.textContent = "Ver dados privados e documentos";
        verDados.onclick = function() { verDadosPrivadosAdmin(pessoa.id, cartao); };
        cartao.appendChild(verDados);

        const aprovar = document.createElement("button");
        aprovar.type = "button";
        aprovar.textContent = "Aprovar cadastro";
        aprovar.onclick = function() { definirAprovacao(pessoa.id, "aprovado", null); };
        cartao.appendChild(aprovar);

        const rejeitar = document.createElement("button");
        rejeitar.type = "button";
        rejeitar.className = "cinza";
        rejeitar.textContent = "Rejeitar cadastro";
        rejeitar.onclick = function() {
            const motivo = prompt("Informe o motivo da rejeição:");
            if (motivo === null) return;
            definirAprovacao(pessoa.id, "rejeitado", motivo.trim());
        };
        cartao.appendChild(rejeitar);
        lista.appendChild(cartao);
    }
}

async function verDadosPrivadosAdmin(entregadorId, cartao) {
    const { data, error } = await supabaseClient
        .from("dados_privados_entregadores")
        .select("*")
        .eq("entregador_id", entregadorId)
        .maybeSingle();
    if (error || !data) {
        alert("Não foi possível ler os dados privados: " + (error ? error.message : "cadastro privado não encontrado"));
        return;
    }

    let texto = "CPF: " + (data.cpf || "-") +
        "\nEndereço: " + [data.logradouro, data.numero_endereco, data.complemento, data.bairro, data.cidade, data.uf, data.cep].filter(Boolean).join(", ") +
        "\nBanco: " + (data.banco || "-") +
        "\nAgência: " + (data.agencia || "-") +
        "\nConta: " + (data.conta || "-") +
        "\nTipo de conta: " + (data.tipo_conta || "-") +
        "\nChave Pix: " + (data.chave_pix || "-");
    alert(texto);

    const { data: urlDoc } = await supabaseClient.storage.from("documentos-entregadores").createSignedUrl(data.documento_path, 120);
    const { data: urlComp } = await supabaseClient.storage.from("documentos-entregadores").createSignedUrl(data.comprovante_residencia_path, 120);
    if (urlDoc && urlDoc.signedUrl) window.open(urlDoc.signedUrl, "_blank", "noopener");
    if (urlComp && urlComp.signedUrl) window.open(urlComp.signedUrl, "_blank", "noopener");
}

async function definirAprovacao(entregadorId, status, motivo) {
    const { error } = await supabaseClient.rpc("admin_definir_aprovacao", {
        p_entregador_id: entregadorId,
        p_status: status,
        p_motivo: motivo
    });
    if (error) {
        console.error("Erro ao alterar aprovação:", error);
        alert("Não foi possível atualizar a aprovação: " + error.message);
        return;
    }
    alert(status === "aprovado" ? "Entregador aprovado!" : "Cadastro rejeitado.");
    carregarCadastrosPendentes();
}

async function sairConta() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error("Erro ao sair:", error);
    servicoAtual = null;
    localStorage.removeItem("serviGoServico");
    abrir("inicio");
}

/* Quando o HTML carrega, mantém os botões de serviço ocultos até haver status. */
document.addEventListener("DOMContentLoaded", function() {
    atualizarBotoesServico(null);
});
