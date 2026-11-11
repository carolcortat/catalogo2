# Catálogo Online com Pedidos via WhatsApp

Catálogo de produtos para pequenos empreendedores. O cliente escolhe os produtos, monta o pedido e o
envia **direto para o WhatsApp do vendedor**, com tudo organizado em uma mensagem pronta. Não há
pagamento online nem pedidos guardados em banco: o pedido existe na conversa do WhatsApp.

- **Catálogo público** (sem login): busca, categorias, detalhes, variações, carrinho e finalização.
- **Painel do vendedor** (`/admin`, com login): produtos, categorias, fotos, WhatsApp, pagamentos e dados da loja.
- **Tecnologias:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase (banco, login e imagens),
  Zustand, React Hook Form + Zod.

## Testar agora (sem configurar nada)

```bash
npm install
npm run dev        # abre em http://localhost:3000
```

Sem o Supabase configurado, o catálogo funciona com **produtos de demonstração** e o envio para o
WhatsApp já funciona (número de exemplo). O painel `/admin` mostra um aviso com os passos de configuração.

## Configurar o painel do vendedor (Supabase)

1. Crie um projeto gratuito em <https://supabase.com>.
2. Abra **SQL Editor > New query**, cole o conteúdo de `supabase/migrations/001_init.sql` e clique em **Run**.
   Isso cria as tabelas, as regras de segurança e o espaço de imagens.
3. **Segurança (importante):** em **Authentication > Providers > Email**, **desative "Allow new users to sign up"**.
   As regras do banco permitem edição a qualquer usuário logado; com o cadastro aberto, qualquer pessoa poderia
   criar uma conta e alterar seu catálogo.
4. Em **Authentication > Users > Add user**, crie o usuário do vendedor (e-mail e senha) e marque como confirmado.
5. Copie `.env.example` para `.env.local` e preencha com os dados do botão **Connect** do Supabase
   (ou de **Project Settings > API Keys**):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua-chave
   NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
   ```

   Projetos mais antigos mostram a chave como `anon`; nesse caso use o nome `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (o app aceita os dois). A chave pública é feita para ficar no navegador: quem protege os dados são as regras
   (RLS) do passo 2. **Nunca use a chave `secret` / `service_role` neste projeto.**
6. Reinicie o servidor, acesse `/admin`, entre e vá em **Loja** para cadastrar nome, logo, cor, banner e o
   **número do WhatsApp** que receberá os pedidos.

## Publicar (Vercel, plano gratuito)

1. Envie o projeto para um repositório no GitHub e importe em <https://vercel.com/new>.
2. Em **Environment Variables**, adicione as variáveis do passo 5 (use a URL final do site em `NEXT_PUBLIC_SITE_URL`).
3. Clique em **Deploy**. Compartilhe o link do catálogo no WhatsApp e no Instagram: a pré-visualização mostra o
   nome e a imagem da loja.

## Como o pedido chega ao vendedor

O botão **Enviar pedido pelo WhatsApp** abre `https://wa.me/<número>?text=<mensagem>`. A mensagem tem este formato:

```
Olá! Gostaria de fazer um pedido.

Dados do cliente:
Nome: Maria

Produtos:

2x Caderno personalizado – R$ 45,00
Opções: Cor da capa: Rosa
Observação: Capa na cor rosa.

1x Agenda personalizada – R$ 60,00

Subtotal: R$ 150,00

Forma de pagamento: Pix.
Recebimento: Entrega.
Endereço: Rua das Flores, 10 - Centro
Observações gerais: Entregar no período da tarde.

TOTAL: R$ 150,00
```

O pedido só é enviado quando o cliente toca em **Enviar** dentro do WhatsApp. O carrinho do cliente só é limpo
quando ele confirma "Já enviei".

## Estrutura de pastas

```
src/
├── app/
│   ├── (public)/            # área pública: home, produto/[id], carrinho, finalizar
│   ├── admin/               # login + (panel)/ protegido: produtos, categorias, configurações
│   └── api/revalidate/      # atualiza o catálogo público após edições (só vendedor logado)
├── components/
│   ├── ui/                  # Button, Field, Modal, Toast, Badge
│   ├── catalog/  product/  cart/  checkout/  admin/
├── lib/                     # whatsapp.ts, currency.ts, validators.ts, data.ts, admin.ts, supabase/
├── store/cart.ts            # carrinho (Zustand + localStorage)
├── proxy.ts                 # proteção otimista do /admin e renovação da sessão
└── types/
supabase/migrations/001_init.sql
```

## Segurança

- O público só **lê** produtos, categorias e configurações. Escrever exige login (regras RLS no banco).
- `/admin` é protegido em duas camadas: `proxy.ts` (redireciona visitantes) e verificação no servidor em cada
  página do painel. O endpoint `/api/revalidate` também exige login.
- Textos digitados pelo cliente são limpos (sem quebras de linha nem caracteres de controle) antes de entrar na
  mensagem, e tudo é codificado para URL.
- Envio de imagens: somente JPG, PNG, WebP e GIF, até 5 MB, validado no navegador e no bucket do Supabase.
- Cabeçalhos de segurança ativos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Versão de produção |
| `npm test` | Testes automatizados (carrinho, valores, mensagem do WhatsApp, validações, fluxo de finalização) |
| `npm run lint` | Verificação de código |

## Limitações conhecidas

- Não há controle de estoque nem histórico de pedidos (por decisão do escopo da primeira versão).
- Se o vendedor enviar uma foto e sair do formulário sem salvar, o arquivo fica no armazenamento (ocupa pouco espaço).
- Um pedido muito grande (dezenas de itens com observações longas) pode ultrapassar o tamanho aceito pelo link do
  WhatsApp; o app avisa e pede para dividir o pedido.
