document.addEventListener('DOMContentLoaded', () => {
    function getFilmesLocais() {
        // Tenta pegar os filmes do localStorage, ou retorna um array vazio se não houver
        const filmes = localStorage.getItem('meusFilmes');
        return filmes ? JSON.parse(filmes) : [];
    }

    function salvarFilmesLocais(filmes) {
        localStorage.setItem('meusFilmes', JSON.stringify(filmes));
    }

    // Função para simular dados de filme por ID (para o pop-up, antes de usar API real)
    // No futuro, esta função fará uma requisição para a API (TMDb/OMDb)
    async function getDetalhesFilmeSimulado(filmeId) {
        // Dados estáticos de exemplo para demonstração do pop-up.
        // Em um projeto real, você faria uma chamada fetch() para uma API aqui.
        const filmesMockData = {
            "tt1375666": { // ID de A Origem
                titulo: "A Origem",
                ano: "2010",
                genero: "Ficção Científica, Ação",
                minhaNota: "9.5",
                sinopse: "Um ladrão que rouba segredos corporativos através do uso de tecnologia de sonho é encarregado de plantar uma ideia na mente de um CEO.",
                capa: "https://image.tmdb.org/t/p/w200/edv5qpE4yUqT4G0Jd5S1QzMUG8K.jpg" // Exemplo de URL de capa
            },
            "tt0816692": { // ID de Interestelar
                titulo: "Interestelar",
                ano: "2014",
                genero: "Ficção Científica, Drama",
                minhaNota: "10.0",
                sinopse: "Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.",
                capa: "https://image.tmdb.org/t/p/w200/xYijTfS5xI5cI9G1F87CjM3rY0Y.jpg"
            },
            "tt0068646": { // ID de O Poderoso Chefão
                titulo: "O Poderoso Chefão",
                ano: "1972",
                genero: "Crime, Drama",
                minhaNota: "9.8",
                sinopse: "O patriarca da família Corleone transfere o controle de seu império secreto para seu filho relutante.",
                capa: "https://image.tmdb.org/t/p/w200/kNf0HnK89jTz4gWzS3Z1S4E3Z7.jpg"
            }
            // Adicione mais filmes aqui para testar com seus IDs no HTML
        };
        return filmesMockData[filmeId];
    }


    // --- LÓGICA ESPECÍFICA PARA CADA PÁGINA ---

    // 1. Lógica para a página "Meus Filmes" (lista-filmes.html)
    // Isso deve ser executado APENAS se estivermos na página lista-filmes.html
    if (window.location.pathname.includes('lista-filmes.html')) {
        console.log("JavaScript carregado para a página Meus Filmes.");

        // --- LÓGICA DO POP-UP DE DETALHES DO FILME ---
        const modal = document.getElementById('modalDetalhesFilme');
        const fecharModalBtn = document.querySelector('.fechar-modal');
        const modalFilmeTitulo = document.getElementById('modalFilmeTitulo');
        const modalFilmeCapa = document.getElementById('modalFilmeCapa');
        const modalFilmeAno = document.getElementById('modalFilmeAno');
        const modalFilmeGenero = document.getElementById('modalFilmeGenero');
        const modalFilmeNota = document.getElementById('modalFilmeNota');
        const modalFilmeSinopse = document.getElementById('modalFilmeSinopse');

        // Adiciona evento de clique em todos os botões de detalhes
        document.querySelectorAll('.botao-tabela-detalhes').forEach(button => {
            button.addEventListener('click', async (event) => {
                const filmeId = event.currentTarget.dataset.filmeId; // Pega o ID do filme do atributo data-filme-id
                console.log(`Botão Detalhes clicado para o filme ID: ${filmeId}`);

                const detalhesFilme = await getDetalhesFilmeSimulado(filmeId); // Usa a função simulada

                if (detalhesFilme) {
                    modalFilmeTitulo.textContent = detalhesFilme.titulo;
                    modalFilmeCapa.src = detalhesFilme.capa;
                    modalFilmeCapa.alt = `Capa de ${detalhesFilme.titulo}`;
                    modalFilmeAno.textContent = detalhesFilme.ano;
                    modalFilmeGenero.textContent = detalhesFilme.genero;
                    modalFilmeNota.textContent = detalhesFilme.minhaNota;
                    modalFilmeSinopse.textContent = detalhesFilme.sinopse;

                    modal.style.display = 'flex'; // Exibe o modal
                } else {
                    alert('Detalhes do filme não encontrados. Tente novamente mais tarde.');
                    console.error(`Filme com ID ${filmeId} não encontrado nos dados mock.`);
                }
            });
        });

        // Adiciona evento de clique no botão de fechar o modal
        fecharModalBtn.addEventListener('click', () => {
            modal.style.display = 'none'; // Oculta o modal
        });

        // Adiciona evento de clique no overlay (fora do conteúdo) para fechar o modal
        window.addEventListener('click', (event) => {
            if (event.target == modal) { // Se o clique foi no overlay do modal
                modal.style.display = 'none'; // Oculta o modal
            }
        });

        // --- LÓGICA PARA CARREGAR FILMES NA TABELA (Futuro: dados do usuário) ---
        // Exemplo: Carregar filmes do localStorage ao carregar a página
        // function carregarFilmesNaTabela() {
        //     const filmesSalvos = getFilmesLocais();
        //     const tbody = document.querySelector('.tabela-filmes tbody');
        //     tbody.innerHTML = ''; // Limpa a tabela existente
        //     filmesSalvos.forEach(filme => {
        //         const newRow = tbody.insertRow();
        //         newRow.innerHTML = `
        //             <td>${filme.titulo}</td>
        //             <td>${filme.ano || 'N/A'}</td>
        //             <td>${filme.genero || 'N/A'}</td>
        //             <td>${filme.minhaNota}</td>
        //             <td>
        //                 <button class="botao-tabela-detalhes" data-filme-id="${filme.id}">
        //                     <i class="fas fa-info"></i>
        //                 </button>
        //             </td>
        //         `;
        //     });
        // }
        // carregarFilmesNaTabela(); // Chame esta função para preencher a tabela dinamicamente
    }

    // 2. Lógica para a página "Adicionar Filme" (adicionar-filme.html)
    if (window.location.pathname.includes('adicionar-filme.html')) {
        console.log("JavaScript carregado para a página Adicionar Filme.");

        const formularioAdicionarFilme = document.querySelector('.formulario-adicionar-filme');
        const inputTitulo = document.getElementById('tituloFilme');
        const inputMinhaNota = document.getElementById('minhaNota');

        // Lógica para o input type="range" (Slider) se você decidiu usá-lo
        const inputNotaSlider = document.getElementById('minhaNota'); // O mesmo ID se for slider
        const valorNotaDisplay = document.getElementById('valorNotaDisplay');

        if (inputNotaSlider && valorNotaDisplay) {
            // Atualiza o display ao mover o slider
            inputNotaSlider.addEventListener('input', () => {
                valorNotaDisplay.textContent = parseFloat(inputNotaSlider.value).toFixed(1);
            });
            // Garante que o valor inicial seja exibido
            valorNotaDisplay.textContent = parseFloat(inputNotaSlider.value).toFixed(1);
        }

        if (formularioAdicionarFilme) {
            formularioAdicionarFilme.addEventListener('submit', (event) => {
                event.preventDefault(); // Impede o envio padrão do formulário (que recarregaria a página)

                const titulo = inputTitulo.value.trim();
                const nota = parseFloat(inputMinhaNota.value); // Converte para número

                if (titulo && !isNaN(nota)) {
                    const filmesAtuais = getFilmesLocais(); // Pega filmes já salvos
                    const novoFilme = {
                        id: Date.now().toString(), // ID simples para este exemplo (timestamp)
                        titulo: titulo,
                        minhaNota: nota,
                        // Para um app real, você coletaria ano e gênero aqui também
                        ano: "N/A", // Placeholder
                        genero: "N/A" // Placeholder
                    };

                    filmesAtuais.push(novoFilme); // Adiciona o novo filme
                    salvarFilmesLocais(filmesAtuais); // Salva de volta no localStorage

                    alert(`Filme "${titulo}" com nota ${nota} adicionado à sua lista!`);
                    formularioAdicionarFilme.reset(); // Limpa o formulário
                    
                    // Se estiver usando o slider, reseta o display também
                    if (inputNotaSlider && valorNotaDisplay) {
                        inputNotaSlider.value = inputNotaSlider.min || 0; // Reseta para o valor mínimo
                        valorNotaDisplay.textContent = parseFloat(inputNotaSlider.value).toFixed(1);
                    }

                } else {
                    alert('Por favor, preencha o Título do Filme e uma Nota válida.');
                }
            });
        }
    }

    // 3. Lógica para a página "Home" (index.html)
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        console.log("JavaScript carregado para a página Home.");

        // Lógica futura para carregar "Filmes Adicionados Recentemente" da API
        // Exemplo:
        // const filmesRecentementeAdicionadosContainer = document.querySelector('.lista-filmes-horizontal');
        // if (filmesRecentementeAdicionadosContainer) {
        //     // Chame sua função para buscar filmes populares/recentes da API (TMDb) aqui
        //     // e crie os cards dinamicamente, como no exemplo conceitual que demos anteriormente.
        //     // Por enquanto, o conteúdo da Home pode permanecer estático ou com dados mock.
        // }
    }

    // --- LÓGICA PARA CAIXA DE PESQUISA (Se for global) ---
    // const caixaPesquisa = document.querySelector('.caixa-pesquisa');
    // if (caixaPesquisa) {
    //     caixaPesquisa.addEventListener('keypress', (event) => {
    //         if (event.key === 'Enter') {
    //             const termoPesquisa = caixaPesquisa.value.trim();
    //             if (termoPesquisa) {
    //                 alert(`Pesquisando por: ${termoPesquisa}`);
    //                 // Aqui você redirecionaria para uma página de resultados
    //                 // ou faria uma busca na API e mostraria os resultados
    //             }
    //         }
    //     });
    // }

});