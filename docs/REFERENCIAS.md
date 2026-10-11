# Referências do jogo

Fontes das afirmações históricas e técnicas de **LLM: The Prediction Factory**, com o grau de certeza de cada uma. Este arquivo atende a Prioridade 2 do plano de melhorias (revisão histórica e bibliográfica). Quem mudar um texto histórico no jogo (`src/v2/content/stops.ts`, `src/v2/content/codex.ts`) também deve atualizar a linha correspondente aqui.

**Grau de certeza**
- **Alto:** fato documentado em fonte primária e aceito pelos historiadores.
- **Médio:** aceito em geral, mas com data aproximada ou detalhes discutidos.
- **Interpretação:** hipótese ou leitura de historiadores; o jogo apresenta como tal.

No jogo, a fonte de cada ilha aparece no fim do documento (quadro **📚 Fontes**). As metáforas aparecem no quadro **🔍 O jogo simplificou**.

---

## 1. Fase 1 · O Arquivo da Memória

| Ilha | O que o jogo afirma | Fonte primária | Fonte secundária | Certeza | Observações |
|---|---|---|---|---|---|
| **Fichas de barro** (Uruk, c. 3500 a.C.) | Fichas de barro representavam mercadorias (como ovelhas); eram guardadas em envelopes com marcas por fora; essas marcas estão entre os primeiros números escritos. | Envelopes (bulas) e fichas de Susa e Uruk (ex.: Louvre Sb 1932). | Denise Schmandt-Besserat, *Before Writing* (1992) e *How Writing Came About* (1996). | Médio / Interpretação | A ligação fichas → números escritos é muito aceita. A tese completa (fichas → toda a escrita) tem críticos (ex.: Paul Zimansky, resenha de 1993). O jogo diz isso no documento extra e no Codex. “Tokens” é o termo usado pelos arqueólogos. |
| **Fichas: datas** | Algumas fichas têm mais de 9.000 anos. | Achados do Levante e da Mesopotâmia (c. 8000 a.C.). | Schmandt-Besserat (1992). | Alto | |
| **Liu Hui e os Nove Capítulos** | O problema dos três grãos é o 1º do cap. 8 (*fangcheng*) dos *Nove Capítulos*, livro reunido há uns 2.000 anos a partir de textos mais antigos; Liu Hui escreveu comentários em 263. | *Jiuzhang suanshu*, cap. 8, problema 1; comentário de Liu Hui (263 d.C.). | Shen Kangshen, John N. Crossley e Anthony W.-C. Lun, *The Nine Chapters on the Mathematical Art: Companion and Commentary* (Oxford, 1999). Karine Chemla e Guo Shuchun, *Les neuf chapitres* (2004). | Alto (problema e comentário) · Médio (data do livro) | **Correção feita:** a ilha mostrava “200 a.C.”; agora mostra **263** (o comentário de Liu Hui). A data de composição do livro é incerta (entre séc. II a.C. e séc. I d.C.). |
| **Varetas vermelhas e pretas** | Varetas vermelhas para positivos e pretas para negativos. | Comentário de Liu Hui ao cap. 8. | Shen, Crossley e Lun (1999). | Alto | |
| **Eliminação** | O método de eliminar incógnitas já estava nos *Nove Capítulos*; na Europa apareceu mais de mil anos depois e hoje se chama eliminação de Gauss. | *Jiuzhang suanshu*, cap. 8. | Joseph F. Grcar, “How ordinary elimination became Gaussian elimination”, *Historia Mathematica* 38 (2011). | Alto | |
| **Determinante e “matriz”** (extra) | Seki (1683) e Leibniz (1693) chegaram ao determinante sem se conhecer; Sylvester criou o nome “matrix” em 1850. | Seki Takakazu, *Kai fukudai no hō* (1683); carta de Leibniz a L’Hôpital (1693); Sylvester, *Philosophical Magazine* (1850). | Grcar (2011); MacTutor History of Mathematics (Univ. de St Andrews). | Alto | |
| **Al-Khwarizmi** (c. 825) | Trabalhou em Bagdá; escreveu sobre as contas com os algarismos indianos; o nome latinizado (“Algoritmi”) deu “algoritmo”; o *Al-jabr* deu nome à álgebra. | *Algoritmi de numero Indorum* (tradução latina, séc. XII); *Al-kitāb al-mukhtaṣar fī ḥisāb al-jabr wa-l-muqābala* (c. 820). | MacTutor; Roshdi Rashed, *Al-Khwarizmi: The Beginnings of Algebra* (2009). | Alto · Médio (data exata) | A natureza da “Casa da Sabedoria” é discutida por historiadores; o jogo a trata só como lugar de estudo. |
| **Pascal e Fermat** (1654) | Um amigo apostador fez a pergunta; as cartas Pascal–Fermat sobre a divisão de uma aposta interrompida são um marco da teoria da probabilidade. **Antes deles**, Cardano e Galileu já tinham feito contas com dados. | Correspondência Pascal–Fermat (1654). Cardano, *Liber de ludo aleae* (escrito c. 1564, publicado em 1663). Galileu, *Sopra le scoperte dei dadi* (c. 1620). | Ian Hacking, *The Emergence of Probability* (1975). Keith Devlin, *The Unfinished Game* (2008). | Alto | **Correção feita:** o jogo dizia “pela primeira vez, alguém fez contas com um futuro incerto”. Agora fala em marco e cita os antecessores. O amigo costuma ser identificado como o Chevalier de Méré. |
| **Triângulo de Pascal** (extra) | Matemáticos chineses e persas já conheciam o triângulo séculos antes. | Jia Xian (séc. XI) e Yang Hui (1261); al-Karaji e Omar Khayyam. | MacTutor. | Alto | |
| **Leibniz e o binário** (1703) | Leibniz escreveu sobre o sistema binário em 1703 (publicado em 1705); outros já tinham pensado nisso. Boole (1854) mostrou a lógica com 0 e 1. | Leibniz, “Explication de l’arithmétique binaire”, *Mémoires de l’Académie Royale des Sciences* (ano 1703, publ. 1705). Boole, *The Laws of Thought* (1854). | Thomas Harriot (c. 1600) e Juan Caramuel (1670) já tinham usado bases binárias: ver MacTutor. | Alto | **Correção feita:** “publiquei” virou “escrevi em 1703”, com a nota de que outros vieram antes. |
| **Gauss e Ceres** (1801–1809) | Ceres foi visto por Piazzi em 1801 e se perdeu; Gauss, aos 24 anos, calculou a órbita, e Ceres reapareceu no fim de 1801 perto do previsto. O método dos mínimos quadrados foi publicado por Legendre (1805) e por Gauss (1809). | Gauss, *Theoria motus corporum coelestium* (1809). Legendre, *Nouvelles méthodes pour la détermination des orbites des comètes* (1805). | Stephen M. Stigler, *The History of Statistics* (1986). | Alto (previsão e datas de publicação) · Interpretação (o quanto os mínimos quadrados entraram no cálculo de 1801) | **Correção feita:** a previsão de 1801 e a publicação do método aparecem separadas. Ceres é chamado hoje de planeta anão (IAU, 2006). A disputa de prioridade Gauss × Legendre é contada por Stigler. |
| **Ada Lovelace** (1843) | Nas notas sobre a Máquina Analítica, montou uma sequência de passos (Nota G, números de Bernoulli), que muitos consideram o primeiro programa; imaginou a máquina trabalhando com símbolos e música. | L. F. Menabrea, *Sketch of the Analytical Engine*, tradução e Notas de A.A.L. (1843), Notas A e G. | Doron Swade, *The Difference Engine* (2001); Science Museum (Londres). | Alto (as notas) · Interpretação (“primeiro programa”) | O jogo usa “muita gente considera”. A Máquina Analítica nunca foi construída. |
| **Babbage** (extra) | A Máquina Diferencial nº 2 foi construída em 1991 pelo Museu de Ciências de Londres, seguindo os desenhos. O tear de Jacquard (1804) usava cartões perfurados. | Desenhos de Babbage (1847–1849). | Swade (2001). | Alto | A impressora da máquina ficou pronta em 2000. |
| **Cayley** (1858) | Escreveu as regras para somar e multiplicar matrizes. | Arthur Cayley, “A Memoir on the Theory of Matrices”, *Philosophical Transactions* (1858). | MacTutor. | Alto | |
| **Markov** (1913) | Contou 20 mil letras de *Eugênio Oneguin*; depois de uma vogal vinha consoante 87 vezes em 100. Já estudava as cadeias desde 1906. | A. A. Markov, comunicação à Academia de São Petersburgo (1913); artigo de 1906 sobre cadeias. | Brian Hayes, “First Links in the Markov Chain”, *American Scientist* 101 (2013). | Alto | **Correção feita:** o jogo dizia que o poema “virou a cadeia de Markov”; agora diz que as cadeias vinham de 1906 e o poema foi uma aplicação. |
| **Shannon** (1948, 1951) | Mediu a informação em bits (respostas de sim ou não); em 1951 jogou de adivinhar a próxima letra; o ASCII é de 1963. | Shannon, “A Mathematical Theory of Communication” (1948); “Prediction and Entropy of Printed English” (1951). ASA X3.4-1963. | James Gleick, *A Informação* (2011). | Alto | O nome “bit” foi sugerido por John Tukey, como o próprio Shannon conta em 1948 (está no quadro de fontes). |
| **Rosenblatt e o Perceptron** (1943, 1958) | McCulloch e Pitts (1943) imaginaram o neurônio feito de contas; Rosenblatt apresentou o Perceptron em 1958, que ajustava os pesos ao errar. | McCulloch e Pitts, *Bulletin of Mathematical Biophysics* (1943). Rosenblatt, “The Perceptron”, *Psychological Review* 65 (1958). | Mikel Olazaran, “A Sociological Study of the Official History of the Perceptrons Controversy” (1996). | Alto | **Correção feita:** “construí” virou “apresentei”: a máquina Mark I Perceptron ficou pronta em 1960. |

### Ideias que o jogo marca como metáfora (Fase 1)

| Metáfora | O que é de verdade | Onde o jogo avisa |
|---|---|---|
| Ficha = token | Um token é um pedaço de texto definido pelo tokenizador de cada LLM (palavra, pedaço, espaço, pontuação). | Documento “As fichas de barro” (O jogo simplificou) e Codex “Fichas (tokens)”. |
| Mistério dos grãos = treino | Os pesos não saem de um sistema de equações exato; são ajustados aos poucos no treino. | Documento “O mistério dos três grãos”. |
| Neurônio artificial = neurônio | É uma conta inspirada no neurônio, muito mais simples. | Documento “O neurônio que aprende”. |
| Cadeia de Markov = LLM | Markov olha só o que veio logo antes; a LLM olha todo o contexto. | Documento “O que vem depois?”. |
| O caminho de “O céu é ___” | Faltam peças (como a atenção) e os números são ilustrativos. | Fim do painel do caminho (Fase 1). |

---

## 2. Conceitos técnicos (Fases 2 e 3)

| Conceito | O que o jogo afirma | Referência | Simplificação assumida no jogo |
|---|---|---|---|
| **Tokens e tokenizador** | O texto é cortado em tokens (palavras, pedaços, espaços, pontuação); cada token tem um ID; cada LLM tem seu tokenizador. | Rico Sennrich, Barry Haddow e Alexandra Birch, “Neural Machine Translation of Rare Words with Subword Units” (2016, BPE). Taku Kudo e John Richardson, “SentencePiece” (2018). | O tokenizador do jogo é didático (prefixos e sufixos do português); os IDs da pergunta são inventados. |
| **Embeddings** | O ID puxa um vetor aprendido no treino; palavras usadas de jeito parecido ficam perto; algumas direções guardam relações (Brasil→Brasília ≈ Portugal→Lisboa); as camadas transformam os vetores conforme o contexto. | Tomas Mikolov et al., “Efficient Estimation of Word Representations in Vector Space” (2013) e “Linguistic Regularities in Continuous Space Word Representations” (2013). | Mapa em 2 dimensões com bairros nomeados; dimensões reais não têm nomes simples; analogias nem sempre funcionam. |
| **Atenção e Transformer** | Uma conta que pondera quanto cada token usa dos outros (consulta, chave e valor; softmax); várias cabeças em cada camada; tokens só olham para trás ao gerar. | Ashish Vaswani et al., “Attention Is All You Need” (2017). Sarthak Jain e Byron Wallace, “Attention is not Explanation” (2019). | Porcentagens e mapa de calor ilustrativos; no caminho do jogo, atenção e camadas aparecem como passos separados, mas na vida real se alternam dentro de cada camada. |
| **Próximo token e geração** | A LLM calcula uma distribuição sobre os tokens; um método de escolha pega um; o token entra no contexto e o processo se repete. Chance alta não é verdade. | Alec Radford et al., “Language Models are Unsupervised Multitask Learners” (2019). | O jogo fala em “palavras” em vez de tokens em vários lugares. |
| **Temperatura e amostragem** | A temperatura divide os logits antes do softmax: baixa = previsível, alta = variada; não controla a verdade. Top-k e top-p são outros botões. | Angela Fan et al., “Hierarchical Neural Story Generation” (2018, top-k). Ari Holtzman et al., “The Curious Case of Neural Text Degeneration” (2020, top-p). | A roleta usa a contagem de 8 frases. |
| **Treino e perda** | Chutar, medir o erro (entropia cruzada), ajustar os pesos pelo gradiente; o erro costuma cair com oscilações; perda baixa no treino não garante generalização. | Ian Goodfellow, Yoshua Bengio e Aaron Courville, *Deep Learning* (2016), caps. 5, 6 e 8. | 27 pesos (Fase 2) e algumas centenas (Fase 3). |
| **Dados e generalização** | A LLM aprende padrões, não guarda os textos como arquivo; pode montar frases novas certas ou erradas; dados ruins geram respostas ruins. | Chiyuan Zhang et al., “Understanding deep learning requires rethinking generalization” (2017). Emily Bender et al., “On the Dangers of Stochastic Parrots” (2021). | O teste de frases não vistas usa a mini-rede do jogador. |
| **RAG** | Uma arquitetura em volta da LLM: recuperação de trechos + geração com eles no contexto. Opcional; não elimina alucinações; documentos podem ser velhos, errados ou irrelevantes. | Patrick Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks” (2020). | Busca por palavras (saco de palavras), não por embeddings. |
| **Alucinação** | Respostas fluentes e confiantes podem estar erradas; fluência ≠ verdade. | Ziwei Ji et al., “Survey of Hallucination in Natural Language Generation” (2023). | |
| **Ajuste fino** | Treina de novo uma LLM já treinada e muda os pesos; o resultado depende dos dados, do método e da intensidade; pode ter efeitos colaterais. | Jeremy Howard e Sebastian Ruder, “Universal Language Model Fine-tuning” (2018). | O ajuste do jogo usa o modelinho de 27 pesos e um exemplo só. |
| **Preferências (alinhamento)** | Pessoas comparam respostas; a LLM é ajustada para preferir as mais úteis, honestas e seguras. | Paul Christiano et al., “Deep RL from Human Preferences” (2017). Long Ouyang et al., “Training language models to follow instructions with human feedback” (2022). | O painel só mostra a escolha das pessoas, não o treino que vem depois. |
| **Mini-rede da Fase 3** | Rede neural de verdade treinada no navegador: embeddings de 3 números dos últimos 1 a 3 tokens → 12 neurônios (tanh) → softmax; descida do gradiente com entropia cruzada. Sem atenção e sem camadas empilhadas. | Yoshua Bengio et al., “A Neural Probabilistic Language Model” (2003), a mesma arquitetura em miniatura. | Implementação em `src/v2/content/llm.ts` (`MiniLM`). |

---

## 3. Imagens históricas (Fase 1)

As imagens vêm do Wikimedia Commons e são carregadas direto de `upload.wikimedia.org`. Os créditos abaixo são os que estão registrados em `src/v2/content/photos.ts`. **Antes de uma publicação comercial, reconfira a licença de cada arquivo na página do Commons.** O ambiente de desenvolvimento não acessa o Commons.

| Ilha | Imagem | Autoria e data | Acervo | Licença registrada | Página |
|---|---|---|---|---|---|
| Fichas | Envelope de barro e fichas de contar | Susa, c. 3300 a.C.; foto de Jastrow | Museu do Louvre (Sb 1932) | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:Accountancy_clay_envelope_Louvre_Sb1932.jpg) |
| Fichas | Fichas de contar de Susa | Susa | Museu do Louvre | **A conferir** | [Commons](https://commons.wikimedia.org/wiki/File:Clay_accounting_tokens_Susa_Louvre_n2.jpg) |
| Liu Hui | Página dos *Nove Capítulos* | Edição ilustrada do séc. XIX | — | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:%E4%B9%9D%E7%AB%A0%E7%AE%97%E8%A1%93%E7%B4%B0%E8%8D%89%E5%9C%96%E8%AA%AA.jpg) |
| Al-Khwarizmi | Selo da URSS, 1983 | Correios da URSS | — | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:1983_CPA_5426.jpg) |
| Pascal | Retrato | Autor desconhecido, séc. XVII | Palácio de Versalhes | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:Blaise_Pascal_Versailles.JPG) |
| Leibniz | Retrato | Christoph Bernhard Francke, c. 1695 | Herzog Anton Ulrich-Museum, Braunschweig | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:Christoph_Bernhard_Francke_-_Bildnis_des_Philosophen_Leibniz_(ca._1695).jpg) |
| Gauss | Retrato | Christian Albrecht Jensen, 1840 (cópia de 1887) | — | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:Carl_Friedrich_Gauss_1840_by_Jensen.jpg) |
| Ada Lovelace | Retrato | Alfred Edward Chalon, c. 1840 | Science Museum, Londres | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:Ada_Lovelace_portrait.jpg) |
| Cayley | Retrato | Foto do séc. XIX | Smithsonian Libraries | Domínio público / sem restrições conhecidas | [Commons](https://commons.wikimedia.org/wiki/File:Arthur_Cayley.jpg) |
| Markov | Retrato | Foto antiga | São Petersburgo | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:AAMarkov.jpg) |
| Shannon | Foto | Konrad Jacobs | Instituto de Matemática de Oberwolfach | CC BY-SA 2.0 de (exige crédito) | [Commons](https://commons.wikimedia.org/wiki/File:ClaudeShannon_MFO3807.jpg) |
| Rosenblatt (substituta) | Neurônios desenhados à mão (cérebro de pombo) | Santiago Ramón y Cajal, 1899 | Instituto Cajal, Madri | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:PurkinjeCell.jpg) |

---

## 4. Pendências para a revisão especializada

- Pedir a um historiador da matemática que confira a Fase 1 inteira (principalmente fichas de barro, Liu Hui e a disputa Gauss × Legendre), como recomenda o plano.
- Reconferir as licenças das imagens marcadas “a conferir”.
- A cada mudança de texto, atualizar esta tabela e gerar de novo `docs/JOGO_COMPLETO.md`.
