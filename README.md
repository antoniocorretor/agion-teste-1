# Agion 1.2 – Guia Rápido para Desenvolvedores

Este repositório contém o simulador Agion 1.2. Siga os passos abaixo para instalar as dependências, executar o app e resolver problemas comuns.

## Pré-requisitos

- **Node.js 18+** (inclui o npm)
- Terminal com acesso aos comandos `node` e `npm`

Verifique a instalação com:

```bash
node -v
npm -v
```

## Instalação e execução

1. Clone o repositório ou extraia o `.zip` do projeto.
2. Entre na pasta do projeto pelo terminal (`cd agion-teste-1`).
3. Instale as dependências:

   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   O app ficará disponível em `http://localhost:5173`.

Para gerar a versão de produção execute `npm run build` e visualize com `npm run preview`.

## Publicando no GitHub

Depois que o projeto estiver funcionando localmente, siga estes passos para enviar o código para um repositório no GitHub:

1. **Crie um repositório vazio no GitHub.** Guarde a URL (ex.: `https://github.com/seu-usuario/agion-teste-1.git`).
2. **Verifique o status local** para garantir que todos os arquivos desejados estão prontos para serem versionados:

   ```bash
   git status
   ```

3. **Configure o repositório remoto** (apenas na primeira vez):

   ```bash
   git remote add origin https://github.com/seu-usuario/agion-teste-1.git
   ```

4. **Confirme os arquivos e faça o commit** (ajuste a mensagem conforme necessário):

   ```bash
   git add .
   git commit -m "feat: publica simulador Agion"
   ```

5. **Envie o código para o GitHub**:

   ```bash
   git push -u origin main
   ```

   Use `main` ou `master` de acordo com o nome do branch que você estiver utilizando.

6. **Confirme no GitHub** que os arquivos apareceram no repositório e configure a proteção de branch ou colaboradores, se necessário.

Após o primeiro push, basta usar `git add`, `git commit` e `git push` para enviar novas alterações.

## Resolvendo o erro `npm.ps1 não pode ser carregado`

Esse erro aparece no **PowerShell do Windows** quando a política de execução impede scripts. Existem duas soluções simples:

1. **Alterar a política apenas para o usuário atual** (recomendado):

   Abra o PowerShell como administrador e execute:

   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

   Confirme com `S` (Sim). Em seguida, feche e abra novamente o PowerShell e rode `npm install` normalmente.

2. **Usar o Prompt de Comando clássico (`cmd.exe`)**:

   Abra o `cmd`, navegue até a pasta do projeto e execute `npm install`. O `cmd` não aplica a política do PowerShell, então o comando funciona imediatamente.

> **Dica:** após ajustar a política uma vez, você poderá usar o PowerShell normalmente com o npm.

## Estrutura do projeto

```
/
├── index.html
├── package.json
├── src/
│   ├── backend/
│   │   ├── fluxo.ts
│   │   └── types.ts
│   └── frontend/
│       ├── App.tsx
│       ├── components.tsx
│       └── utils.ts
└── ... (configurações do Vite, Tailwind e TypeScript)
```

## Suporte

Caso encontre outro problema, abra uma issue ou informe o erro e o sistema operacional utilizado.
