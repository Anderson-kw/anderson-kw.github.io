// script.js

// --- Configurações da API TMDB ---
// ATENÇÃO: SUBSTITUA 'SUA_CHAVE_AQUI' PELA SUA CHAVE DE API (v3 auth) REAL DO TMDB.
// Acesse: https://www.themoviedb.org/settings/api para obter a sua chave.
const TMDB_API_KEY = '1058045695cdc5a9f7c5533e16b91eda'; // EX: '1234567890abcdef1234567890abcdef'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Função auxiliar para fazer requisições à API TMDB de forma robusta
async function fetchTmdb(path, params = {}) {
    // Constrói os parâmetros da URL de forma segura usando URLSearchParams
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
        ...params // Adiciona quaisquer outros parâmetros específicos da requisição
    });

    try {
        // Constrói a URL final usando o caminho (path) e os parâmetros formatados
        const response = await fetch(`${TMDB_BASE_URL}${path}?${queryParams.toString()}`);

        if (!response.ok) {
            // Se a resposta não for OK (ex: status 401 Unauthorized), tenta ler a mensagem de erro da API
            const errorBody = await response.text(); // Lê o corpo da resposta como texto
            console.error(`Erro da API TMDB: ${response.status} - ${response.statusText || 'N/A'}`, errorBody);
            // Lança um erro para ser capturado pelo bloco catch
            throw new Error(`Erro na requisição TMDB: ${response.status} - ${response.statusText || 'Status não disponível'}. Detalhes: ${errorBody.substring(0, 150)}...`);
        }
        return await response.json(); // Retorna os dados JSON da resposta
    } catch (error) {
        // Captura erros de rede ou erros lançados acima
        console.error("Erro ao buscar dados do TMDB:", error.message);
        // Retorna null para indicar que a requisição falhou, permitindo que a função chamadora lide com isso
        return null;
    }
}

// --- Funções de Manipulação do LocalStorage ---
const LOCAL_STORAGE_KEY = 'filmesAssistidos';

function carregarFilmesAssistidos() {
    const filmesJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    return filmesJSON ? JSON.parse(filmesJSON) : [];
}

function salvarFilmesAssistidos(filmes) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filmes));
}

// --- Lógica de Inicialização Principal ---
// Este bloco é executado quando o DOM (Document Object Model) da página está completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname; // Obtém o caminho da URL atual

    // Verifica qual página está sendo carregada para chamar a função específica
    if (path.includes('index.html') || path === '/') {
        console.log('Página: Index (Home)');
        carregarFilmesEmDestaque();
    } else if (path.includes('adicionar-filme.html')) {
        console.log('Página: Adicionar Filme Assistido');
        configurarAdicionarFilme();
    } else if (path.includes('lista-filmes.html')) {
        console.log('Página: Lista de Filmes Assistidos');
        carregarListaFilmes();
    }
    // A pesquisa global está presente em todas as páginas
    configurarPesquisaGlobal();
});

// --- Funções Específicas de Páginas ---

// Função para carregar filmes em destaque na página inicial (index.html)
async function carregarFilmesEmDestaque() {
    const containerDestaque = document.getElementById('filmesEmDestaque');
    if (!containerDestaque) {
        console.warn("Elemento #filmesEmDestaque não encontrado. Verifique o HTML da página index.html.");
        return; // Sai da função se o container não for encontrado
    }

    containerDestaque.innerHTML = '<p style="text-align: center; padding: 20px; color: #B0B0B0;">Carregando filmes...</p>';

    try {
        // Busca filmes populares do TMDB. A função fetchTmdb já cuida da API Key e idioma.
        const data = await fetchTmdb('/movie/popular');

        if (data && data.results && data.results.length > 0) {
            containerDestaque.innerHTML = ''; // Limpa a mensagem "Carregando filmes..."
            // Itera sobre os primeiros 10 filmes (ou menos se houver menos resultados)
            data.results.slice(0, 10).forEach(filme => {
                const cardFilme = document.createElement('div');
                cardFilme.classList.add('card-filme-recente');
                cardFilme.innerHTML = `
                    <img src="${filme.poster_path ? TMDB_IMAGE_BASE_URL + filme.poster_path : 'https://via.placeholder.com/150x225?text=Sem+Capa'}" alt="${filme.title}">
                    <h4>${filme.title}</h4>
                    <button class="botao-adicionar" data-filme-id="${filme.id}" data-sinopse="${filme.overview || 'Sinopse não disponível.'}">Ver Sinopse</button>
                `;
                containerDestaque.appendChild(cardFilme);
            });

            // Adiciona event listeners para os botões de sinopse recém-criados
            document.querySelectorAll('.botao-adicionar').forEach(button => {
                button.addEventListener('click', (event) => {
                    // Obtém o título do filme a partir do elemento irmão anterior (h4)
                    const tituloFilme = event.target.previousElementSibling.textContent;
                    const sinopse = event.target.dataset.sinopse; // Obtém a sinopse do data-attribute
                    alert(`Sinopse de "${tituloFilme}":\n\n${sinopse}`); // Exibe a sinopse em um alerta
                });
            });

        } else {
            // Mensagem caso não consiga carregar os filmes
            containerDestaque.innerHTML = '<p style="text-align: center; padding: 20px; color: #B0B0B0;">Não foi possível carregar os filmes em destaque. Verifique a chave da API.</p>';
            console.error("Dados de filmes populares não encontrados ou vazios:", data);
        }
    } catch (error) {
        // Captura e exibe qualquer erro que ocorra durante o carregamento
        console.error("Erro ao carregar filmes em destaque:", error);
        containerDestaque.innerHTML = '<p style="text-align: center; padding: 20px; color: #B0B0B0;">Erro ao carregar filmes. Verifique sua conexão ou a chave da API.</p>';
    }
}

// Função para configurar a página de adicionar filme (adicionar-filme.html)
function configurarAdicionarFilme() {
    const inputPesquisaFilme = document.getElementById('inputPesquisaFilme');
    const resultadosPesquisaAutocomplete = document.getElementById('resultadosPesquisaAutocomplete');
    const formAdicionarFilme = document.getElementById('formAdicionarFilme');
    const filmeSelecionadoInfo = document.querySelector('.filme-selecionado-info');
    const filmeSelecionadoIdInput = document.getElementById('filmeSelecionadoId');
    const capaSelecionadaImg = document.getElementById('capaSelecionada');
    const displayTituloSelecionado = document.getElementById('displayTituloSelecionado');
    const displayAnoSelecionado = document.getElementById('displayAnoSelecionado');
    const displayGeneroSelecionado = document.getElementById('displayGeneroSelecionado');
    const displaySinopseSelecionada = document.getElementById('displaySinopseSelecionada');
    const minhaNotaInput = document.getElementById('minhaNota');

    let filmeSelecionadoDetalhes = null; // Armazena os detalhes completos do filme selecionado

    // Função assíncrona para buscar filmes para o autocompletar
    async function buscarFilmesAutocomplete(query) {
        // Só começa a buscar a partir de 3 caracteres para otimizar requisições
        if (query.length < 3) {
            resultadosPesquisaAutocomplete.innerHTML = ''; // Limpa resultados
            resultadosPesquisaAutocomplete.style.display = 'none'; // Esconde a div de resultados
            return;
        }

        // Chama a API do TMDB para pesquisa de filmes, passando a query como parâmetro
        const data = await fetchTmdb('/search/movie', { query: query });

        resultadosPesquisaAutocomplete.innerHTML = ''; // Limpa resultados anteriores

        if (data && data.results && data.results.length > 0) {
            // Mostra até 5 resultados relevantes para o autocompletar
            data.results.slice(0, 5).forEach(filme => {
                const item = document.createElement('div');
                item.classList.add('item-autocomplete'); // Classe para estilização
                item.textContent = `${filme.title} (${filme.release_date ? filme.release_date.substring(0, 4) : 'Ano Indisponível'})`;
                item.dataset.filmeId = filme.id; // Armazena o ID do filme para buscas futuras de detalhes

                // Adiciona um event listener para quando um item do autocompletar é clicado
                item.addEventListener('click', async () => {
                    inputPesquisaFilme.value = filme.title; // Preenche o input com o título completo
                    resultadosPesquisaAutocomplete.innerHTML = ''; // Limpa a lista de sugestões
                    resultadosPesquisaAutocomplete.style.display = 'none'; // Esconde a div de resultados

                    // Busca detalhes completos do filme selecionado usando o ID
                    filmeSelecionadoDetalhes = await fetchTmdb(`/movie/${filme.id}`);
                    if (filmeSelecionadoDetalhes) {
                        filmeSelecionadoIdInput.value = filmeSelecionadoDetalhes.id;
                        capaSelecionadaImg.src = filmeSelecionadoDetalhes.poster_path ? TMDB_IMAGE_BASE_URL + filmeSelecionadoDetalhes.poster_path : 'https://via.placeholder.com/100x150?text=Sem+Capa';
                        displayTituloSelecionado.textContent = filmeSelecionadoDetalhes.title;
                        displayAnoSelecionado.textContent = filmeSelecionadoDetalhes.release_date ? filmeSelecionadoDetalhes.release_date.substring(0, 4) : 'N/A';
                        displayGeneroSelecionado.textContent = filmeSelecionadoDetalhes.genres ? filmeSelecionadoDetalhes.genres.map(g => g.name).join(', ') : 'N/A';
                        displaySinopseSelecionada.textContent = filmeSelecionadoDetalhes.overview || 'Sinopse não disponível.';
                        filmeSelecionadoInfo.style.display = 'block'; // Mostra as informações do filme
                    }
                });
                resultadosPesquisaAutocomplete.appendChild(item);
            });
            resultadosPesquisaAutocomplete.style.display = 'block'; // Mostra a caixa de resultados
        } else {
            resultadosPesquisaAutocomplete.style.display = 'none'; // Esconde se não houver resultados
        }
    }

    // Event Listener para o input de pesquisa, que chama a função de autocompletar
    inputPesquisaFilme.addEventListener('input', (event) => {
        buscarFilmesAutocomplete(event.target.value);
    });

    // Esconde a lista de autocompletar ao clicar fora dela
    document.addEventListener('click', (event) => {
        if (!resultadosPesquisaAutocomplete.contains(event.target) && event.target !== inputPesquisaFilme) {
            resultadosPesquisaAutocomplete.style.display = 'none';
        }
    });

    // Lidar com o envio do formulário para adicionar o filme assistido
    formAdicionarFilme.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        if (!filmeSelecionadoDetalhes) {
            alert('Por favor, selecione um filme da lista de sugestões antes de adicionar.');
            return;
        }

        const minhaNota = parseFloat(minhaNotaInput.value);
        if (isNaN(minhaNota) || minhaNota < 0 || minhaNota > 10) {
            alert('Por favor, insira uma nota válida entre 0 e 10.');
            return;
        }

        const filmesAssistidos = carregarFilmesAssistidos();
        // Verifica se o filme já está na lista para evitar duplicatas
        const filmeExistente = filmesAssistidos.find(f => f.id === filmeSelecionadoDetalhes.id);
        if (filmeExistente) {
            alert('Este filme já está na sua lista de assistidos!');
            return;
        }

        // Busca créditos (diretor, elenco) do filme
        const credits = await fetchTmdb(`/movie/${filmeSelecionadoDetalhes.id}/credits`);
        let diretor = 'N/A';
        let elenco = 'N/A';
        if (credits) {
            const directorObj = credits.crew.find(c => c.job === 'Director');
            diretor = directorObj ? directorObj.name : 'N/A';
            elenco = credits.cast.slice(0, 5).map(a => a.name).join(', ') || 'N/A'; // Pega os 5 primeiros atores
        }

        // Cria o objeto do novo filme assistido com todos os detalhes
        const novoFilmeAssistido = {
            id: filmeSelecionadoDetalhes.id,
            titulo: filmeSelecionadoDetalhes.title,
            ano: filmeSelecionadoDetalhes.release_date ? filmeSelecionadoDetalhes.release_date.substring(0, 4) : 'N/A',
            genero: filmeSelecionadoDetalhes.genres ? filmeSelecionadoDetalhes.genres.map(g => g.name).join(', ') : 'N/A',
            sinopse: filmeSelecionadoDetalhes.overview || 'Sinopse não disponível.',
            capa: filmeSelecionadoDetalhes.poster_path ? TMDB_IMAGE_BASE_URL + filmeSelecionadoDetalhes.poster_path : 'https://via.placeholder.com/200x300?text=Sem+Capa',
            minhaNota: minhaNota,
            diretor: diretor,
            duracao: filmeSelecionadoDetalhes.runtime ? `${filmeSelecionadoDetalhes.runtime} min` : 'N/A',
            classificacao: filmeSelecionadoDetalhes.adult ? 'Para maiores de 18 anos' : 'Livre',
            elenco: elenco
        };

        filmesAssistidos.push(novoFilmeAssistido); // Adiciona o filme à lista
        salvarFilmesAssistidos(filmesAssistidos); // Salva a lista atualizada no LocalStorage

        alert('Filme adicionado à sua lista de assistidos!');
        formAdicionarFilme.reset(); // Limpa o formulário
        filmeSelecionadoInfo.style.display = 'none'; // Esconde as informações do filme selecionado
        filmeSelecionadoDetalhes = null; // Reseta o filme selecionado
        resultadosPesquisaAutocomplete.innerHTML = ''; // Limpa a lista de sugestões
    });
}

// Função para carregar a lista de filmes assistidos na página lista-filmes.html
async function carregarListaFilmes() {
    const corpoTabelaFilmes = document.getElementById('corpoTabelaFilmes');
    const modalDetalhesFilme = document.getElementById('modalDetalhesFilme');
    const fecharModalSpan = document.querySelector('.fechar-modal');

    // Elementos do modal para exibir os detalhes do filme
    const modalFilmeCapa = document.getElementById('modalFilmeCapa');
    const modalFilmeTitulo = document.getElementById('modalFilmeTitulo');
    const modalFilmeAno = document.getElementById('modalFilmeAno');
    const modalFilmeGenero = document.getElementById('modalFilmeGenero');
    const modalFilmeNota = document.getElementById('modalFilmeNota');
    const modalFilmeSinopse = document.getElementById('modalFilmeSinopse');
    const modalFilmeDiretor = document.getElementById('modalFilmeDiretor');
    const modalFilmeDuracao = document.getElementById('modalFilmeDuracao');
    const modalFilmeElenco = document.getElementById('modalFilmeElenco');
    const modalFilmeClassificacao = document.getElementById('modalFilmeClassificacao');

    if (!corpoTabelaFilmes) return; // Sai se o corpo da tabela não for encontrado

    const filmes = carregarFilmesAssistidos(); // Carrega os filmes do LocalStorage
    corpoTabelaFilmes.innerHTML = ''; // Limpa o conteúdo atual da tabela

    if (filmes.length === 0) {
        // Mensagem se a lista estiver vazia
        corpoTabelaFilmes.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #B0B0B0;">Você ainda não adicionou nenhum filme.</td></tr>';
        return;
    }

    // Popula a tabela com os filmes assistidos
    for (const filme of filmes) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${filme.capa}" alt="${filme.titulo}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 3px;"></td>
            <td></td> <td>${filme.titulo}</td>
            <td>${filme.ano}</td>
            <td>${filme.genero}</td>
            <td>${filme.minhaNota.toFixed(1)}</td>
            <td>
                <button class="botao-detalhes" data-filme-id="${filme.id}">
                    <img src="info.png" alt="Informações">
                </button>
            </td>
        `;
        corpoTabelaFilmes.appendChild(row);
    }

    // Adiciona event listeners aos botões de detalhes para abrir o modal
    document.querySelectorAll('.botao-detalhes').forEach(button => {
        button.addEventListener('click', async (event) => {
            const filmeId = parseInt(event.currentTarget.dataset.filmeId); // Converte para número
            const filmeDetalhesSalvos = filmes.find(f => f.id === filmeId); // Encontra o filme na lista

            if (filmeDetalhesSalvos) {
                // Preenche o modal com as informações do filme
                modalFilmeCapa.src = filmeDetalhesSalvos.capa;
                modalFilmeTitulo.textContent = filmeDetalhesSalvos.titulo;
                modalFilmeAno.textContent = filmeDetalhesSalvos.ano;
                modalFilmeGenero.textContent = filmeDetalhesSalvos.genero;
                modalFilmeNota.textContent = filmeDetalhesSalvos.minhaNota.toFixed(1);
                modalFilmeSinopse.textContent = filmeDetalhesSalvos.sinopse;

                // Preenche os novos campos de detalhes do modal (com verificação para evitar erros se a ID não existir)
                if (modalFilmeDiretor) modalFilmeDiretor.textContent = filmeDetalhesSalvos.diretor;
                if (modalFilmeDuracao) modalFilmeDuracao.textContent = filmeDetalhesSalvos.duracao;
                if (modalFilmeElenco) modalFilmeElenco.textContent = filmeDetalhesSalvos.elenco;
                if (modalFilmeClassificacao) modalFilmeClassificacao.textContent = filmeDetalhesSalvos.classificacao;

                modalDetalhesFilme.style.display = 'flex'; // Exibe o modal
            }
        });
    });

    // Event listener para fechar o modal clicando no botão "X"
    fecharModalSpan.addEventListener('click', () => {
        modalDetalhesFilme.style.display = 'none';
    });

    // Event listener para fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target == modalDetalhesFilme) {
            modalDetalhesFilme.style.display = 'none';
        }
    });
}

// Função para configurar a barra de pesquisa global no cabeçalho
function configurarPesquisaGlobal() {
    const caixaPesquisaGlobal = document.getElementById('caixaPesquisaGlobal');

    if (caixaPesquisaGlobal) {
        caixaPesquisaGlobal.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const query = caixaPesquisaGlobal.value.trim();
                if (query) {
                    alert(`Pesquisa global por: "${query}" - A ser implementada!`);
                    // Futuramente, você pode redirecionar para uma página de resultados de pesquisa global
                    // window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}