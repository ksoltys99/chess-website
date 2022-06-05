# chess-website
This app is my implementation of chess GUI from scratch. The game itself is written in pure JS.
You can play with yourself or with chess engine. As an engine, app uses stockfish.js which is Stockfish 5 compiled to JS via emscripten compiler. You can read more about it here: https://github.com/exoticorn/stockfish-js. 
There is also position editor which allows you to start game from some custom position in case you want to train endgames or any specific opening.
If you want to run this app locally, you need to have Node.js and Express.js installed.
Starting server:
```
node server.js
```
