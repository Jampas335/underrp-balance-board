# UnderRP Balance Board

Ferramenta visual para montar e revisar a progressão econômica do UnderRP: atividades, itens, pagamentos e conexões ficam organizados em um único canvas.

## Rodar localmente

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

## Uso

O quadro abre em modo leitura. Assim, qualquer pessoa pode consultar a progressão sem alterar o mapa.

Para editar:

1. Clique em `EDITAR`.
2. Informe um Fine-grained Personal Access Token do GitHub.
3. O token deve ter acesso ao repositório configurado e a permissão `Contents: Read and write`.
4. Crie, conecte e edite blocos; clique em `SALVAR` para publicar o JSON.

O token é validado contra o repositório e fica apenas em `sessionStorage`: ele não entra no código, não vai para o `.env`, não é salvo no `localStorage` e é removido quando a sessão do navegador termina ou quando você usa `BLOQUEAR EDIÇÃO`.

O arquivo remoto padrão é `data/balance-board.json` no repositório `Jampas335/underp-itens`. Ajuste apenas os valores não secretos do `.env` usando `.env.example` se o destino mudar.

## Limite de segurança

Esta é uma proteção de interface para um site estático: o navegador envia o token diretamente ao GitHub para validar e salvar o JSON. Para proteção forte em produção, com usuários e tokens que nunca chegam ao navegador, será necessário um backend ou função serverless. Nenhum token deve ser colocado em variáveis `VITE_*`.
