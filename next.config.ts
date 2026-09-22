import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // headers() roda no servidor e devolve cabeçalhos HTTP extras em TODA resposta
  // do site — diferente de configurações que só valem em uma página específica.
  // Repare que o Content-Security-Policy NÃO está aqui: ele precisa mudar a cada
  // requisição (por causa do nonce), então vive no middleware (src/proxy.ts).
  async headers() {
    return [
      {
        source: "/:path*", // aplica em todas as rotas, sem exceção
        headers: [
          {
            // Impede que o site seja carregado dentro de um <iframe> em outro
            // domínio — essa é a defesa contra "clickjacking" (um site malicioso
            // te mostrando o Controle de Vendas escondido atrás de botões falsos).
            // O CSP (no middleware) já faz a mesma coisa com frame-ancestors,
            // mas mantemos esse cabeçalho também pra navegadores mais antigos.
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Impede que o navegador tente "adivinhar" o tipo de um arquivo
            // diferente do que o servidor declarou — proteção contra alguns
            // tipos de ataque que se aproveitam dessa adivinhação
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Controla quanta informação da URL de origem é enviada quando a
            // pessoa clica num link que sai do seu site — reduz vazamento de dados
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Desliga o acesso a câmera, microfone e localização por padrão —
            // um sistema de controle de vendas não precisa de nenhum desses
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // HSTS: diz ao navegador "sempre acesse este site por HTTPS, nunca
            // por HTTP simples, pelos próximos 2 anos". Só faz efeito quando o
            // site realmente está publicado com HTTPS (em produção, não local).
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

