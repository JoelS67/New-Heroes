# New Heroes: The First Steps

Portal de interpretação de personagens (RP), criado com **Node.js**, **Express** e **EJS**. O site apresenta o universo, a história, o mapa, os personagens, a temporada e as notícias. Ele também inclui um painel administrativo para editar o conteúdo sem precisar mexer nos arquivos das páginas.

## Como iniciar o site

### Requisitos

- Node.js 18 ou superior.
- Terminal aberto na pasta do projeto.

### Instalação e execução local

Na primeira vez, instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Depois, abra no navegador:

- Site: <http://localhost:3000>
- Painel administrativo: <http://localhost:3000/admin>

Para encerrar o servidor, volte ao terminal onde ele está rodando e pressione `Ctrl+C`.

## Clonar e editar pelo celular

O painel `/admin` funciona no navegador do celular para editar o conteúdo do site. Se também quiser clonar e alterar os arquivos do projeto no próprio celular, siga o guia do seu aparelho.

### Android — Termux

O jeito mais direto de rodar este projeto localmente no Android é usar o **Termux**. Instale-o pelo F-Droid ou pela página oficial de releases do Termux no GitHub; evite versões antigas da Play Store. Abra o Termux e execute:

```bash
pkg update
pkg install git nodejs-lts
git clone https://github.com/JoelS67/New-Heroes.git
cd New-Heroes
npm install
npm start
```

Com o servidor em execução, abra o navegador do mesmo celular e acesse:

- Site: <http://127.0.0.1:3000>
- Painel: <http://127.0.0.1:3000/admin>

Use as credenciais de teste descritas na seção **Acessar o painel Admin**. Mantenha o Termux aberto enquanto estiver usando o site; para pará-lo, volte ao Termux e pressione `Ctrl+C`.

Para atualizar sua cópia com as mudanças mais recentes do GitHub, pare o servidor e execute `git pull` dentro da pasta `New-Heroes`. Se você já modificou os mesmos arquivos, o Git poderá pedir que resolva conflitos antes de atualizar.

#### Editar arquivos do projeto no Android

- Para mudar textos, páginas, imagens e aparência do conteúdo do site, prefira o painel `/admin` no navegador.
- Para editar diretamente os arquivos de código, use um editor de texto no Termux (por exemplo, `nano`) ou um editor Android com integração ao Termux. A cópia clonada fica na pasta privada do Termux, dentro de `$HOME/New-Heroes`.
- Exemplo: para editar o conteúdo publicado diretamente em JSON, pare de preferência o servidor e abra `data/site-content.json` com seu editor; depois inicie o site de novo. Uma publicação feita no painel pode sobrescrever esse arquivo, portanto não edite o JSON ao mesmo tempo que outra pessoa estiver publicando.
- Mantenha o projeto e `node_modules` dentro do armazenamento privado do Termux. **Não rode `npm install` em `Downloads` ou no armazenamento compartilhado do Android**: permissões e links de arquivos podem não funcionar como o Node espera.

### iPhone ou iPad

O iOS não oferece o mesmo ambiente local do Termux para rodar este servidor Express. Para editar os arquivos do repositório pelo iPhone/iPad, uma opção prática é usar um **GitHub Codespace** pelo navegador, se esse recurso estiver disponível para sua conta e para o repositório:

1. Abra o repositório <https://github.com/JoelS67/New-Heroes> e entre na sua conta GitHub.
2. Selecione **Code → Codespaces** e crie um Codespace para o repositório.
3. No terminal do Codespace, execute `npm install` e depois `npm start`.
4. Na aba **Ports**, abra a porta `3000` no navegador. A URL encaminhada abre o site; acrescente `/admin` ao final para acessar o painel.
5. Edite os arquivos no editor web do Codespace e use o Git para salvar e enviar suas alterações ao repositório.

Se não tiver acesso a Codespaces, ainda é possível editar conteúdo pelo painel do site já hospedado, acessando o endereço publicado e acrescentando `/admin`. Para alterar o código-fonte no iPhone/iPad, use um editor Git compatível ou um ambiente de desenvolvimento remoto.

> **Atenção à segurança:** não compartilhe um link de Codespace ou uma porta encaminhada junto com a senha de teste. A senha `123` é apenas para desenvolvimento e não deve ser usada em uma instalação pública.

## Acessar o painel Admin

1. Com o site aberto, adicione `/admin` ao final do endereço. Por exemplo, se o site estiver em `https://meu-site.com`, acesse `https://meu-site.com/admin`.
2. Entre com as credenciais locais de teste:
   - **Usuário:** `admin`
   - **Senha:** `123`
3. Ao entrar, escolha uma página na lista à esquerda. As alterações ficam como rascunho no painel até você clicar em **Publicar alterações**.

Se o site estiver hospedado em outro endereço ou porta, mantenha esse endereço e troque somente o caminho final por `/admin`.

> **Importante — credenciais de teste:** `admin` / `123` são apenas para desenvolvimento local. Qualquer pessoa que conheça essa senha pode tentar entrar. **Não publique o site usando a senha de teste.** Antes da publicação, configure credenciais fortes no ambiente do servidor: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (diferente de `123`) e `SESSION_SECRET`. Em modo de produção, o servidor impede a inicialização se essas configurações estiverem faltando ou se a senha ainda for `123`. Use HTTPS em produção.

## O que dá para fazer no painel

- Alterar o nome do portal, a logo, o texto do rodapé, a cor de destaque e a cor de fundo.
- Editar o título, a etiqueta, a descrição e a imagem de capa de cada página.
- Adicionar, editar, remover e reordenar seções.
- Colocar texto, imagens e blocos expansíveis de “ver mais” nas seções.
- Adicionar, editar e remover cards, personagens e notícias, incluindo título, etiqueta, descrição, imagem e link interno.
- Criar páginas completas e escolher se aparecem no menu público.
- Excluir páginas criadas pelo painel. As páginas principais do site não podem ser excluídas.
- Baixar um backup JSON do conteúdo atual.

### Imagens

É possível escolher uma imagem já existente em `public/assets/` ou enviar pelo painel um arquivo **JPG, PNG ou WebP de até 5 MB**. As imagens enviadas são salvas em `public/uploads/`. Preencha o texto alternativo para descrever as imagens e melhorar a acessibilidade.

### Criar e publicar uma página

1. Clique no botão `＋` ao lado de **Páginas do portal** e digite o nome.
2. Edite título, etiqueta, descrição, capa e opção de exibição no menu.
3. Use **Adicionar seção** para compor a página; em cada seção, adicione texto, imagem e/ou cards.
4. Clique em **Publicar alterações**. A nova página ficará disponível no endereço gerado a partir do nome, por exemplo, `/guia-do-servidor`.
5. Para descartar a página, selecione-a e use **Excluir esta página**; confirme e publique a alteração.

Alterações feitas no formulário não afetam o site público até serem publicadas. A opção de backup baixa uma cópia JSON do conteúdo, mas não inclui os arquivos de imagem enviados.

## Páginas padrão

- `/` — início e apresentação do universo.
- `/historia` — premissa e história.
- `/mapa` — mapa conceitual e locais.
- `/personagens` — personagens importantes.
- `/temporada` — temporada e sinopse.
- `/noticias` — notícias do mundo.
- `/<slug>` — páginas adicionais criadas no painel.

## Conteúdo e dados

O conteúdo publicado é armazenado em `data/site-content.json`. As imagens enviadas pelo painel ficam em `public/uploads/`; outras artes do site ficam em `public/assets/`. Esses arquivos precisam ser mantidos junto com o projeto e incluídos nos backups da hospedagem.

As sessões de administrador são mantidas em memória: encerrar ou reiniciar o servidor desconecta os administradores. Em instalações com várias instâncias do servidor, use uma store de sessões compartilhada e armazenamento persistente adequado.

## Testes rápidos

Execute `npm test` para verificar a sintaxe do servidor e dos scripts JavaScript.
