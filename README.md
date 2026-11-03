# EAIDOKY — Streamer Oficial

Projeto React + Vite servido por Express, com Docker para Render.

## Publicação no Render
O repositório deve conter estes arquivos na raiz e a pasta `src` completa:
- `index.html`
- `package.json`
- `server.js`
- `Dockerfile`
- `.dockerignore`
- `src/main.jsx` e `src/style.css`

O Dockerfile verifica se os dois arquivos de `src` chegaram ao build antes de executar o Vite. O `.dockerignore` exclui dependências e arquivos temporários, mas **não** exclui `src`.

## Feed
O site consulta o RSS público do canal a cada 60 segundos. A classificação entre Shorts e demais vídeos é aproximada pela duração, pois o RSS público não fornece uma identificação oficial de Shorts. Se o YouTube bloquear consultas, o feed pode ficar temporariamente indisponível; os links fixos de referência permanecem no site.
