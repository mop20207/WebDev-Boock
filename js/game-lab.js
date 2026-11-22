(() => {
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const grid = $("#gameCatalog");
const detail = $("#gameDetail");
const status = $("#gameStatus");
const progressLabel = $("#gameProgress");
const STORAGE_KEY = "webdevbook.game-lab.v1";
let catalog = [];
let activeId = "";
let engine = null;
let paused = false;
let stats = readStats();

function readStats() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      sessions: Number(value.sessions) || 0,
      completed: Array.isArray(value.completed) ? value.completed : [],
      best: value.best && typeof value.best === "object" ? value.best : {}
    };
  } catch {
    return { sessions: 0, completed: [], best: {} };
  }
}

function saveStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    announce("El navegador no permitió guardar el progreso.");
  }
  updateProgress();
}

function announce(message) {
  if (status) status.textContent = message;
}

function updateProgress() {
  const total = catalog.length;
  const done = catalog.filter(game => stats.completed.includes(game.id)).length;
  if (progressLabel) progressLabel.textContent = done + " de " + total + " juegos completados";
  const completedCount = $("#gameCompleted");
  const sessionCount = $("#gameSessions");
  if (completedCount) completedCount.textContent = String(done);
  if (sessionCount) sessionCount.textContent = String(stats.sessions);
  const bestCount = $("#gameBestCount");
  if (bestCount) bestCount.textContent = String(Object.keys(stats.best).length);
}

function makeCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";
  const icon = document.createElement("span");
  icon.className = "game-card-icon";
  icon.textContent = game.icon;
  const level = document.createElement("span");
  level.className = "game-level";
  level.textContent = game.level;
  const heading = document.createElement("h3");
  heading.textContent = game.title;
  const description = document.createElement("p");
  description.textContent = game.description;
  const footer = document.createElement("div");
  footer.className = "game-card-footer";
  const learned = document.createElement("span");
  learned.textContent = game.concepts.slice(0, 2).join(" · ");
  const action = document.createElement("button");
  action.type = "button";
  action.className = "game-open-button";
  action.dataset.game = game.id;
  action.textContent = stats.completed.includes(game.id) ? "Volver a jugar ↗" : "Jugar y aprender ↗";
  footer.append(learned, action);
  card.append(icon, level, heading, description, footer);
  return card;
}

function renderCatalog() {
  grid.replaceChildren();
  catalog.forEach(game => grid.append(makeCard(game)));
  updateProgress();
}

function infoList(title, values) {
  const section = document.createElement("section");
  section.className = "game-info-block";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("ul");
  values.forEach(value => {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

function openCatalog() {
  activeId = "";
  stopEngine();
  detail.hidden = true;
  grid.hidden = false;
  $(".game-catalog-heading").hidden = false;
  announce("Catálogo de juegos.");
  renderCatalog();
  grid.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stopEngine() {
  if (engine && typeof engine.cleanup === "function") engine.cleanup();
  engine = null;
  paused = false;
}

function startGame(id) {
  const game = catalog.find(item => item.id === id);
  if (!game) return;
  stopEngine();
  activeId = id;
  stats.sessions += 1;
  saveStats();
  grid.hidden = true;
  $(".game-catalog-heading").hidden = true;
  detail.hidden = false;
  detail.replaceChildren();

  const header = document.createElement("div");
  header.className = "game-detail-heading";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "game-back-button";
  back.textContent = "← Volver al laboratorio";
  back.addEventListener("click", openCatalog);
  const titleGroup = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "LABORATORIO DE JUEGOS · " + game.level.toUpperCase();
  const title = document.createElement("h2");
  title.textContent = game.title;
  titleGroup.append(eyebrow, title);
  header.append(back, titleGroup);

  const description = document.createElement("p");
  description.className = "game-detail-description";
  description.textContent = game.description;

  const layout = document.createElement("div");
  layout.className = "game-layout";
  const play = document.createElement("section");
  play.className = "game-play-panel";
  const toolbar = document.createElement("div");
  toolbar.className = "game-toolbar";
  const live = document.createElement("p");
  live.className = "game-live-status";
  live.id = "gameLiveStatus";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  live.textContent = "Preparado. ¡A jugar!";
  const actions = document.createElement("div");
  actions.className = "game-toolbar-actions";
  const pauseButton = document.createElement("button");
  pauseButton.type = "button";
  pauseButton.className = "game-toolbar-button";
  pauseButton.textContent = "Ⅱ Pausar";
  pauseButton.addEventListener("click", () => {
    if (!engine || !engine.pause || !engine.resume) return;
    paused = !paused;
    if (paused) {
      engine.pause();
      pauseButton.textContent = "▶ Continuar";
      live.textContent = "Juego pausado.";
    } else {
      engine.resume();
      pauseButton.textContent = "Ⅱ Pausar";
      live.textContent = "Juego en marcha.";
    }
  });
  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "game-toolbar-button";
  restartButton.textContent = "↻ Reiniciar";
  restartButton.addEventListener("click", () => startGame(id));
  actions.append(pauseButton, restartButton);
  toolbar.append(live, actions);

  const arena = document.createElement("div");
  arena.className = "game-arena";
  arena.id = "gameArena";
  const statusLine = document.createElement("p");
  statusLine.className = "game-result-line";
  statusLine.id = "gameResultLine";
  statusLine.setAttribute("aria-live", "polite");
  statusLine.textContent = "El objetivo y los controles aparecen debajo del tablero.";
  play.append(toolbar, arena, statusLine);

  const learning = document.createElement("aside");
  learning.className = "game-learning-panel";
  learning.append(
    infoList("Objetivos de aprendizaje", game.objectives),
    infoList("Conceptos que vas a practicar", game.concepts),
    infoList("Reglas y controles", game.controls)
  );
  const best = document.createElement("div");
  best.className = "game-best-score";
  best.textContent = "Tu mejor marca: " + (stats.best[id] ?? "Todavía sin marca");
  learning.append(best);
  layout.append(play, learning);
  detail.append(header, description, layout);

  const api = {
    stage: arena,
    setStatus(message) { live.textContent = message; },
    setResult(message) { statusLine.textContent = message; },
    setScore(value) {
      const score = Number(value) || 0;
      if (stats.best[id] === undefined || score > stats.best[id]) {
        stats.best[id] = score;
        best.textContent = "Tu mejor marca: " + score;
        saveStats();
      }
    },
    finish(message, score, won) {
      if (typeof score === "number") api.setScore(score);
      if (won && !stats.completed.includes(id)) {
        stats.completed.push(id);
        saveStats();
      }
      live.textContent = won ? "¡Objetivo completado!" : "Partida finalizada.";
      statusLine.textContent = message;
      const result = document.createElement("div");
      result.className = "game-finish-banner" + (won ? " is-win" : "");
      result.textContent = (won ? "🏆 " : "↻ ") + message;
      arena.append(result);
      if (engine && engine.pause) engine.pause();
      pauseButton.disabled = true;
      announce(message);
    },
    button(label, action, className = "") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "game-control-button " + className;
      button.textContent = label;
      button.addEventListener("click", action);
      return button;
    }
  };

  engine = engines[id](api);
  pauseButton.disabled = !engine || !engine.pause || !engine.resume;
  announce("Comenzó " + game.title + ".");
  detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function canvas(stage, width, height, label) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  element.className = "game-canvas";
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", label);
  stage.append(element);
  return element.getContext("2d");
}

function controlPad(stage, entries) {
  const pad = document.createElement("div");
  pad.className = "game-control-pad";
  entries.forEach(entry => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "game-control-button";
    button.textContent = entry.label;
    button.setAttribute("aria-label", entry.name || entry.label);
    button.addEventListener("click", entry.action);
    pad.append(button);
  });
  stage.append(pad);
  return pad;
}

function keyListener(handler) {
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}

function drawGrid(ctx, width, height, cell) {
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += cell) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += cell) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

const engines = {
  snake(api) {
    const size = 18, cells = 20, canvasSize = size * cells;
    const ctx = canvas(api.stage, canvasSize, canvasSize, "Juego Snake. Usá las flechas o los botones direccionales.");
    let snake, direction, queued, food, score, timer, running = true, over = false;
    const directions = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    function placeFood() {
      const empty = [];
      for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
        if (!snake.some(part => part.x === x && part.y === y)) empty.push({ x, y });
      }
      food = empty[Math.floor(Math.random() * empty.length)];
      if (!food) win();
    }
    function resetState() {
      snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
      direction = "right"; queued = "right"; score = 0; over = false; running = true;
      placeFood(); draw(); api.setScore(0); api.setStatus("Movete y comé la fruta. No choques contra paredes ni contra tu cuerpo.");
    }
    function draw() {
      ctx.fillStyle = "#071323"; ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawGrid(ctx, canvasSize, canvasSize, size);
      if (food) {
        ctx.fillStyle = "#ff718a"; ctx.beginPath();
        ctx.arc(food.x * size + size / 2, food.y * size + size / 2, size * .36, 0, Math.PI * 2); ctx.fill();
      }
      snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#b5c8ff" : "#628cff";
        ctx.fillRect(part.x * size + 1, part.y * size + 1, size - 2, size - 2);
      });
    }
    function win() { over = true; clearInterval(timer); api.finish("¡Llenaste todo el tablero!", score, true); }
    function step() {
      if (!running || over) return;
      direction = queued;
      const vector = directions[direction];
      const head = { x: snake[0].x + vector.x, y: snake[0].y + vector.y };
      const ate = food && head.x === food.x && head.y === food.y;
      const body = ate ? snake : snake.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= cells || head.y >= cells || body.some(part => part.x === head.x && part.y === head.y)) {
        over = true; clearInterval(timer);
        api.finish("Choque. Conseguí 10 frutas para completar el objetivo; reiniciá para volver a intentarlo.", score, score >= 10);
        return;
      }
      snake.unshift(head);
      if (ate) { score += 1; api.setScore(score); placeFood(); }
      else snake.pop();
      draw();
      if (score >= 10) win();
    }
    function turn(next) {
      if (over) return;
      const a = directions[direction], b = directions[next];
      if (a.x + b.x === 0 && a.y + b.y === 0) return;
      queued = next;
    }
    const onKey = event => {
      const map = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
      const next = map[event.key];
      if (next) { event.preventDefault(); turn(next); }
    };
    const removeKey = keyListener(onKey);
    controlPad(api.stage, [
      { label: "↑", name: "Arriba", action: () => turn("up") },
      { label: "←", name: "Izquierda", action: () => turn("left") },
      { label: "↓", name: "Abajo", action: () => turn("down") },
      { label: "→", name: "Derecha", action: () => turn("right") }
    ]);
    resetState(); timer = setInterval(step, 125);
    return {
      pause() { running = false; },
      resume() { if (!over) running = true; },
      cleanup() { clearInterval(timer); removeKey(); }
    };
  },

  pong(api) {
    const width = 640, height = 360;
    const ctx = canvas(api.stage, width, height, "Pong. Mové la paleta con las flechas arriba y abajo o W y S.");
    let player = height / 2 - 42, cpu = height / 2 - 42;
    let ball = { x: width / 2, y: height / 2, vx: 260, vy: 145 };
    let score = 0, rival = 0, running = true, raf = 0, last = 0, up = false, down = false, over = false;
    const paddleH = 84, paddleW = 12;
    function resetBall(direction) {
      ball = { x: width / 2, y: height / 2, vx: 260 * direction, vy: (Math.random() * 180) - 90 };
    }
    function draw() {
      ctx.fillStyle = "#071323"; ctx.fillRect(0, 0, width, height);
      ctx.setLineDash([8, 10]); ctx.strokeStyle = "#61718a"; ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#88a5ff";
      ctx.fillRect(26, player, paddleW, paddleH);
      ctx.fillStyle = "#f5c56a"; ctx.fillRect(width - 38, cpu, paddleW, paddleH);
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.fillStyle = "#e7efff"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(String(score), width / 2 - 46, 48); ctx.fillText(String(rival), width / 2 + 46, 48);
    }
    function step(time) {
      raf = requestAnimationFrame(step);
      if (!running || over) { last = time; return; }
      const dt = Math.min((time - (last || time)) / 1000, .035); last = time;
      if (up) player -= 330 * dt;
      if (down) player += 330 * dt;
      player = Math.max(0, Math.min(height - paddleH, player));
      const target = ball.y - paddleH / 2;
      cpu += Math.max(-235 * dt, Math.min(235 * dt, target - cpu));
      cpu = Math.max(0, Math.min(height - paddleH, cpu));
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.y < 9 || ball.y > height - 9) ball.vy *= -1;
      if (ball.vx < 0 && ball.x < 38 && ball.x > 20 && ball.y > player - 9 && ball.y < player + paddleH + 9) {
        ball.vx = Math.abs(ball.vx) * 1.04; ball.vy += (ball.y - (player + paddleH / 2)) * 4;
      }
      if (ball.vx > 0 && ball.x > width - 50 && ball.x < width - 28 && ball.y > cpu - 9 && ball.y < cpu + paddleH + 9) {
        ball.vx = -Math.abs(ball.vx) * 1.03; ball.vy += (ball.y - (cpu + paddleH / 2)) * 3;
      }
      if (ball.x < 0) { rival += 1; resetBall(1); }
      if (ball.x > width) { score += 1; api.setScore(score); resetBall(-1); }
      if (score >= 5 || rival >= 5) {
        over = true;
        api.finish(score >= 5 ? "¡Ganaste 5 puntos y venciste a la CPU!" : "La CPU llegó a 5 puntos. Volvé a intentarlo.", score, score >= 5);
      }
      draw();
    }
    const onKeyDown = event => {
      if (["ArrowUp", "ArrowDown", "w", "s", "W", "S"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") up = true;
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") down = true;
    };
    const onKeyUp = event => {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") up = false;
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") down = false;
    };
    const removeDown = keyListener(onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    controlPad(api.stage, [
      { label: "↑ Subir", action: () => { player = Math.max(0, player - 38); draw(); } },
      { label: "↓ Bajar", action: () => { player = Math.min(height - paddleH, player + 38); draw(); } }
    ]);
    draw(); raf = requestAnimationFrame(step);
    return {
      pause() { running = false; },
      resume() { if (!over) { running = true; last = 0; } },
      cleanup() { cancelAnimationFrame(raf); removeDown(); document.removeEventListener("keyup", onKeyUp); }
    };
  },

  tetris(api) {
    const cell = 25, cols = 10, rows = 20, width = cols * cell, height = rows * cell;
    const ctx = canvas(api.stage, width, height, "Tetris. Flechas para mover, arriba para girar y espacio para caída rápida.");
    const shapes = [
      [[1, 1, 1, 1]], [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]],
      [[1, 1, 0], [0, 1, 1]], [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]]
    ];
    const colors = ["#50c9da", "#f3c95f", "#a48bff", "#62d9a2", "#ff718a", "#6597ff", "#f39a56"];
    let board, piece, x, y, lines, score, timer, running = true, over = false;
    function newPiece() {
      const index = Math.floor(Math.random() * shapes.length);
      piece = shapes[index].map(row => row.slice());
      piece.color = colors[index];
      x = Math.floor((cols - piece[0].length) / 2); y = 0;
      if (!valid(x, y, piece)) { over = true; clearInterval(timer); api.finish("El tablero se llenó. Completaste " + lines + " líneas.", score, lines >= 10); }
    }
    function valid(px, py, matrix) {
      for (let r = 0; r < matrix.length; r++) for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const nx = px + c, ny = py + r;
        if (nx < 0 || nx >= cols || ny >= rows || (ny >= 0 && board[ny][nx])) return false;
      }
      return true;
    }
    function merge() {
      piece.forEach((row, r) => row.forEach((value, c) => { if (value && y + r >= 0) board[y + r][x + c] = piece.color; }));
      const remaining = board.filter(row => row.some(cellValue => !cellValue));
      const cleared = rows - remaining.length;
      if (cleared) {
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
        api.setScore(score);
        board = Array.from({ length: cleared }, () => Array(cols).fill(0)).concat(remaining);
      }
      newPiece(); draw();
      if (lines >= 10 && !over) { over = true; clearInterval(timer); api.finish("¡Completaste 10 líneas!", score, true); }
    }
    function move(dx, dy) {
      if (over || !running) return false;
      if (valid(x + dx, y + dy, piece)) { x += dx; y += dy; draw(); return true; }
      if (dy > 0) merge();
      return false;
    }
    function rotate() {
      if (over || !running) return;
      const rotated = piece[0].map((_, col) => piece.map(row => row[col]).reverse());
      rotated.color = piece.color;
      if (valid(x, y, rotated)) { piece = rotated; draw(); }
    }
    function hardDrop() { while (move(0, 1)) {} }
    function draw() {
      ctx.fillStyle = "#071323"; ctx.fillRect(0, 0, width, height);
      drawGrid(ctx, width, height, cell);
      board.forEach((row, r) => row.forEach((color, c) => { if (color) { ctx.fillStyle = color; ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2); } }));
      if (piece) piece.forEach((row, r) => row.forEach((value, c) => { if (value) { ctx.fillStyle = piece.color; ctx.fillRect((x + c) * cell + 1, (y + r) * cell + 1, cell - 2, cell - 2); } }));
    }
    function reset() {
      board = Array.from({ length: rows }, () => Array(cols).fill(0));
      lines = 0; score = 0; over = false; running = true; api.setScore(0);
      newPiece(); draw();
      api.setStatus("Completá filas horizontales. Diez líneas cumplen el objetivo.");
    }
    const onKey = event => {
      const map = { ArrowLeft: () => move(-1, 0), ArrowRight: () => move(1, 0), ArrowDown: () => move(0, 1), ArrowUp: rotate, " ": hardDrop };
      if (map[event.key]) { event.preventDefault(); map[event.key](); }
    };
    const removeKey = keyListener(onKey);
    controlPad(api.stage, [
      { label: "←", name: "Mover izquierda", action: () => move(-1, 0) },
      { label: "↻ Girar", action: rotate },
      { label: "→", name: "Mover derecha", action: () => move(1, 0) },
      { label: "↓", name: "Bajar", action: () => move(0, 1) },
      { label: "⤓ Caída rápida", action: hardDrop }
    ]);
    reset(); timer = setInterval(() => { if (running && !over) move(0, 1); }, 520);
    return {
      pause() { running = false; },
      resume() { if (!over) running = true; },
      cleanup() { clearInterval(timer); removeKey(); }
    };
  },

  pacman(api) {
    const mapText = [
      "###############",
      "#.....#.......#",
      "#.###.#.###.#.#",
      "#...#...#...#.#",
      "###.#.###.#.###",
      "#...#.....#...#",
      "#.###.###.###.#",
      "#...#.....#...#",
      "###.#.###.#.###",
      "#...#...#...#.#",
      "#.###.#.###.#.#",
      "#.............#",
      "###############"
    ];
    const tile = 23, cols = 15, rows = 13;
    const ctx = canvas(api.stage, cols * tile, rows * tile, "Laberinto. Mové el personaje con las flechas o botones y recogé todos los puntos.");
    let map, player, ghost, direction, nextDirection, score, remaining, timer, running = true, over = false;
    const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const opposite = { up: "down", down: "up", left: "right", right: "left" };
    function reset() {
      map = mapText.map(row => row.split(""));
      player = { x: 1, y: 1 }; ghost = { x: 7, y: 5 };
      direction = "right"; nextDirection = "right"; score = 0; over = false; running = true;
      remaining = map.flat().filter(value => value === ".").length;
      draw(); api.setScore(0);
      api.setStatus("Recogé todos los puntos y evitá tocar al fantasma.");
    }
    function walkable(x, y) { return y >= 0 && y < rows && x >= 0 && x < cols && map[y][x] !== "#"; }
    function canMove(pos, dir) { const v = vectors[dir]; return walkable(pos.x + v[0], pos.y + v[1]); }
    function draw() {
      ctx.fillStyle = "#071323"; ctx.fillRect(0, 0, cols * tile, rows * tile);
      map.forEach((row, y) => row.forEach((value, x) => {
        if (value === "#") { ctx.fillStyle = "#274b98"; ctx.fillRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2); }
        else if (value === ".") { ctx.fillStyle = "#ffe2a0"; ctx.beginPath(); ctx.arc(x * tile + tile / 2, y * tile + tile / 2, 2.3, 0, Math.PI * 2); ctx.fill(); }
      }));
      ctx.fillStyle = "#ffdf67"; ctx.beginPath(); ctx.arc(player.x * tile + tile / 2, player.y * tile + tile / 2, tile * .39, .2, Math.PI * 1.8); ctx.lineTo(player.x * tile + tile / 2, player.y * tile + tile / 2); ctx.fill();
      ctx.fillStyle = "#ff718a"; ctx.beginPath(); ctx.arc(ghost.x * tile + tile / 2, ghost.y * tile + tile / 2, tile * .37, Math.PI, 0); ctx.lineTo(ghost.x * tile + tile * .87, ghost.y * tile + tile * .88); ctx.lineTo(ghost.x * tile + tile * .68, ghost.y * tile + tile * .73); ctx.lineTo(ghost.x * tile + tile * .5, ghost.y * tile + tile * .88); ctx.lineTo(ghost.x * tile + tile * .3, ghost.y * tile + tile * .73); ctx.lineTo(ghost.x * tile + tile * .13, ghost.y * tile + tile * .88); ctx.fill();
    }
    function movePlayer() {
      if (canMove(player, nextDirection)) direction = nextDirection;
      if (canMove(player, direction)) {
        const v = vectors[direction]; player.x += v[0]; player.y += v[1];
      }
      if (map[player.y][player.x] === ".") { map[player.y][player.x] = " "; remaining--; score += 10; api.setScore(score); }
      if (remaining <= 0) { over = true; clearInterval(timer); api.finish("¡Laberinto despejado! Recogiste todos los puntos.", score, true); return; }
    }
    function moveGhost() {
      const options = Object.keys(vectors).filter(dir => dir !== opposite[ghost.direction] && canMove(ghost, dir));
      const fallback = Object.keys(vectors).filter(dir => canMove(ghost, dir));
      const choices = options.length ? options : fallback;
      if (!choices.length) return;
      choices.sort((a, b) => {
        const av = vectors[a], bv = vectors[b];
        const da = Math.abs(ghost.x + av[0] - player.x) + Math.abs(ghost.y + av[1] - player.y);
        const db = Math.abs(ghost.x + bv[0] - player.x) + Math.abs(ghost.y + bv[1] - player.y);
        return da - db + (Math.random() - .5) * 1.2;
      });
      ghost.direction = choices[0];
      const v = vectors[ghost.direction]; ghost.x += v[0]; ghost.y += v[1];
    }
    function step() {
      if (!running || over) return;
      movePlayer();
      if (over) return;
      moveGhost();
      if (player.x === ghost.x && player.y === ghost.y) {
        over = true; clearInterval(timer);
        api.finish("El fantasma te alcanzó. Reiniciá y probá otra ruta.", score, false);
        return;
      }
      draw();
    }
    const onKey = event => {
      const mapKeys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
      if (mapKeys[event.key]) { event.preventDefault(); nextDirection = mapKeys[event.key]; }
    };
    const removeKey = keyListener(onKey);
    controlPad(api.stage, Object.keys(vectors).map(key => ({ label: ({ up: "↑", down: "↓", left: "←", right: "→" })[key], name: key, action: () => { nextDirection = key; } })));
    reset(); timer = setInterval(step, 155);
    return {
      pause() { running = false; },
      resume() { if (!over) running = true; },
      cleanup() { clearInterval(timer); removeKey(); }
    };
  },

  memory(api) {
    const symbols = ["🐙", "🚀", "🦊", "🎧", "🌙", "🍀", "🎮", "⚡"];
    let deck = [], first = null, lock = false, moves = 0, matches = 0;
    const board = document.createElement("div");
    board.className = "memory-board";
    board.setAttribute("aria-label", "Tablero de memoria de dieciséis cartas");
    api.stage.append(board);
    const counter = document.createElement("p");
    counter.className = "memory-counter";
    api.stage.append(counter);
    function shuffle(items) {
      const result = items.slice();
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
    function update() {
      counter.textContent = "Movimientos: " + moves + " · Parejas: " + matches + " de 8";
      api.setScore(Math.max(0, 100 - moves));
    }
    function choose(index, button) {
      if (lock || deck[index].matched || deck[index].open) return;
      deck[index].open = true;
      button.textContent = deck[index].symbol;
      button.classList.add("is-open");
      button.setAttribute("aria-label", "Carta " + (index + 1) + ": " + deck[index].symbol);
      if (first === null) { first = index; return; }
      moves++;
      const firstIndex = first;
      first = null;
      if (deck[firstIndex].symbol === deck[index].symbol) {
        deck[firstIndex].matched = true; deck[index].matched = true;
        board.children[firstIndex].classList.add("is-matched");
        button.classList.add("is-matched");
        matches++; update();
        if (matches === symbols.length) api.finish("¡Encontraste las ocho parejas en " + moves + " movimientos!", Math.max(0, 100 - moves), true);
      } else {
        lock = true; update();
        window.setTimeout(() => {
          deck[firstIndex].open = false; deck[index].open = false;
          board.children[firstIndex].textContent = "?";
          button.textContent = "?";
          board.children[firstIndex].classList.remove("is-open");
          button.classList.remove("is-open");
          board.children[firstIndex].setAttribute("aria-label", "Carta " + (firstIndex + 1) + " oculta");
          button.setAttribute("aria-label", "Carta " + (index + 1) + " oculta");
          lock = false;
        }, 750);
      }
    }
    deck = shuffle(symbols.concat(symbols)).map(symbol => ({ symbol, open: false, matched: false }));
    deck.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "memory-card"; button.textContent = "?";
      button.setAttribute("aria-label", "Carta " + (index + 1) + " oculta");
      button.addEventListener("click", () => choose(index, button));
      board.append(button);
    });
    update();
    api.setStatus("Buscá las ocho parejas. Solo podés revelar dos cartas a la vez.");
    return { cleanup() {} };
  },

  puzzle(api) {
    const board = document.createElement("div");
    board.className = "puzzle-board";
    board.setAttribute("aria-label", "Rompecabezas numérico de ocho fichas");
    api.stage.append(board);
    const movesLabel = document.createElement("p");
    movesLabel.className = "memory-counter";
    api.stage.append(movesLabel);
    let values = [], moves = 0, buttons = [];
    const goal = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    function adjacent(a, b) { return Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs(a % 3 - b % 3) === 1; }
    function solved() { return values.every((value, index) => value === goal[index]); }
    function render() {
      board.replaceChildren(); buttons = [];
      values.forEach((value, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = value ? "puzzle-tile" : "puzzle-tile is-empty";
        button.textContent = value ? String(value) : "";
        button.setAttribute("aria-label", value ? "Mover ficha " + value : "Espacio vacío");
        button.disabled = value === 0;
        button.addEventListener("click", () => move(index));
        board.append(button); buttons.push(button);
      });
      movesLabel.textContent = "Movimientos: " + moves + " · Completá el orden del 1 al 8";
      api.setScore(Math.max(0, 200 - moves));
    }
    function move(index) {
      const empty = values.indexOf(0);
      if (!adjacent(index, empty)) return;
      [values[index], values[empty]] = [values[empty], values[index]];
      moves++; render();
      if (solved()) api.finish("¡Rompecabezas resuelto en " + moves + " movimientos!", Math.max(0, 200 - moves), true);
    }
    function shuffle() {
      values = goal.slice();
      let previous = -1;
      for (let step = 0; step < 100; step++) {
        const empty = values.indexOf(0);
        const options = values.map((_, index) => index).filter(index => adjacent(index, empty) && index !== previous);
        const choice = options[Math.floor(Math.random() * options.length)];
        [values[choice], values[empty]] = [values[empty], values[choice]];
        previous = empty;
      }
      if (solved()) shuffle();
    }
    shuffle(); moves = 0; render();
    api.setStatus("Deslizá las fichas hacia el espacio vacío para ordenar los números.");
    return { cleanup() {} };
  }
};

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-game]");
  if (button) startGame(button.dataset.game);
});

async function init() {
  try {
    const response = await fetch("../data/games.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de juegos (HTTP " + response.status + ").");
    const data = await response.json();
    catalog = Array.isArray(data.games) ? data.games : [];
    if (!catalog.length) throw new Error("El laboratorio todavía no tiene juegos publicados.");
    $("#gameTotal").textContent = String(catalog.length);
    renderCatalog();
  } catch (error) {
    grid.textContent = error.message || "No se pudo cargar el laboratorio.";
    announce(grid.textContent);
  }
}

window.addEventListener("pagehide", stopEngine);
init();
})();