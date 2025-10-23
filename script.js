// script.js (versión mejorada)
let palabras = [];
let turno = 'rojo';
let puntos = { rojo: 0, azul: 0 };
let temporizadorId = null;
let ticTimeoutId = null;
let tiempoTotal = 0;
let tiempoInicio = 0;
let rondaActiva = false;
let nextRoundReady = false;

const menu = document.getElementById('menu');
const game = document.getElementById('game');
const winnerScreen = document.getElementById('winnerScreen');
const wordElem = document.getElementById('word');
const scoreRed = document.getElementById('scoreRed');
const scoreBlue = document.getElementById('scoreBlue');
const confettiCanvas = document.getElementById('confettiCanvas');
const winnerText = document.getElementById('winnerText');

const ticSound = document.getElementById('ticSound');
const bellSound = document.getElementById('bellSound');
const applauseSound = document.getElementById('applauseSound');

const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = innerWidth;
confettiCanvas.height = innerHeight;
let confettis = [];

async function cargarPalabras() {
  const res = await fetch('palabras.txt');
  const text = await res.text();
  palabras = text.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
}

function cambiarTurno() {
  turno = turno === 'rojo' ? 'azul' : 'rojo';
  document.body.style.background = turno === 'rojo'
    ? 'linear-gradient(135deg, #ff4b2b, #ff416c)'
    : 'linear-gradient(135deg, #36d1dc, #5b86e5)';
}

function palabraAleatoria() {
  if (!palabras.length) return '...';
  return palabras[Math.floor(Math.random() * palabras.length)];
}

function nuevaRonda() {
  rondaActiva = true;
  nextRoundReady = false;

  tiempoTotal = Math.random() * 7000 + 5000;
  tiempoInicio = performance.now();

  clearTimeout(temporizadorId);
  clearTimeout(ticTimeoutId);

  iniciarTicTac();
  temporizadorId = setTimeout(explotar, tiempoTotal);

  cambiarTurno();
  wordElem.textContent = palabraAleatoria();
  wordElem.style.opacity = '1';
  wordElem.style.fontSize = '3em';
}

function iniciarTicTac() {
  const tick = () => {
    if (!rondaActiva) return;

    const elapsed = performance.now() - tiempoInicio;
    const restante = Math.max(0, tiempoTotal - elapsed);
    const progreso = 1 - (restante / tiempoTotal); // 0 al inicio, 1 al final

    // Cuanto menos tiempo quede, más rápido el tic
    // y un pequeño componente aleatorio para generar sorpresa
    let baseInterval = 900;
    if (restante < tiempoTotal * 0.6) baseInterval = 700;
    if (restante < tiempoTotal * 0.4) baseInterval = 450;
    if (restante < tiempoTotal * 0.2) baseInterval = 250;
    if (restante < tiempoTotal * 0.1) baseInterval = 150;
    const randomFactor = Math.random() * 0.3 + 0.85;
    const intervalo = baseInterval * randomFactor;

    try {
      ticSound.currentTime = 0;
      ticSound.play().catch(() => {});
    } catch (e) {}

    ticTimeoutId = setTimeout(tick, intervalo);
  };

  tick();
}

function pararTicTac() {
  clearTimeout(ticTimeoutId);
}

function explotar() {
  rondaActiva = false;
  pararTicTac();
  clearTimeout(temporizadorId);

  try {
    bellSound.currentTime = 0;
    bellSound.play().catch(() => {});
  } catch (e) {}

  const ganador = turno === 'rojo' ? 'azul' : 'rojo';
  puntos[ganador]++;
  actualizarPuntos();

  if (puntos[ganador] >= 3) {
    mostrarGanador(ganador);
  } else {
    // No mostrar texto ni mensaje, solo esperar click
    wordElem.textContent = '';
    nextRoundReady = true;
  }
}

function actualizarPuntos() {
  scoreRed.textContent = `🔴 ${puntos.rojo}`;
  scoreBlue.textContent = `🔵 ${puntos.azul}`;
}

function mostrarGanador(equipo) {
  game.classList.remove('active');
  winnerScreen.classList.add('active');
  winnerText.textContent = `¡${equipo.toUpperCase()} GANA! 🎊`;

  try {
    bellSound.currentTime = 0;
    bellSound.play().catch(() => {});
  } catch (e) {}

  setTimeout(() => {
    try {
      applauseSound.currentTime = 0;
      applauseSound.play().catch(() => {});
    } catch (e) {}
  }, 500);

  lanzarConfeti();
}

function lanzarConfeti() {
  for (let i = 0; i < 150; i++) {
    confettis.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight - innerHeight,
      r: Math.random() * 6 + 4,
      d: Math.random() * 20 + 10,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      tilt: Math.random() * 10 - 10
    });
  }
}

function animarConfeti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  confettis.forEach(c => {
    ctx.beginPath();
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.r, c.r);
    c.y += c.d * 0.1;
    c.x += Math.sin(c.tilt) * 0.5;
  });
  confettis = confettis.filter(c => c.y < innerHeight);
  requestAnimationFrame(animarConfeti);
}

// --- Listeners ---
document.getElementById('playButton').addEventListener('click', async () => {
  menu.classList.remove('active');
  game.classList.add('active');
  await cargarPalabras();
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  nuevaRonda();
});

document.getElementById('restartButton').addEventListener('click', () => {
  // detener aplausos al volver al menú
  applauseSound.pause();
  applauseSound.currentTime = 0;

  winnerScreen.classList.remove('active');
  menu.classList.add('active');
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  confettis = [];
});

game.addEventListener('click', () => {
  if (rondaActiva) {
    cambiarTurno();
    wordElem.textContent = palabraAleatoria();
  } else if (nextRoundReady) {
    nextRoundReady = false;
    nuevaRonda();
  }
});

addEventListener('resize', () => {
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
});

animarConfeti();
