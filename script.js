// script.js — versión con confeti visible y mensaje persistente
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

    // Cuanto menos tiempo quede, más rápido el tic (máx. velocidad algo más lenta)
    let baseInterval = 900;
    if (restante < tiempoTotal * 0.6) baseInterval = 750;
    if (restante < tiempoTotal * 0.4) baseInterval = 550;
    if (restante < tiempoTotal * 0.2) baseInterval = 350;
    if (restante < tiempoTotal * 0.1) baseInterval = 200;

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

function mostrarMensajeRonda(color) {
  const emoji = color === 'rojo' ? '🔴' : '🔵';
  wordElem.textContent = `¡Punto para ${color.toUpperCase()} ${emoji}!`;
  wordElem.style.fontSize = '2em';
  wordElem.style.opacity = '1';
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
    mostrarMensajeRonda(ganador);
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
  wordElem.textContent = ''; // oculta mensaje "punto para" al finalizar partida
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
  // llenar array con partículas nuevas
  confettis = [];
  for (let i = 0; i < 300; i++) {
    confettis.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight - innerHeight,
      r: Math.random() * 6 + 4,
      d: Math.random() * 20 + 10,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngle: Math.random() * Math.PI
    });
  }

  confettiCanvas.style.display = 'block';
  animarConfeti();
}

function animarConfeti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  confettis.forEach(c => {
    c.tiltAngle += 0.1;
    c.y += c.d * 0.1;
    c.x += Math.sin(c.tiltAngle) * 2;

    ctx.beginPath();
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.r, c.r);
  });

  if (confettis.length && confettis.some(c => c.y < innerHeight + 20)) {
    requestAnimationFrame(animarConfeti);
  }
}

// --- Listeners ---
document.getElementById('playButton').addEventListener('click', async () => {
  menu.classList.remove('active');
  game.classList.add('active');
  await cargarPalabras();
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  confettiCanvas.style.display = 'none';
  nuevaRonda();
});

document.getElementById('restartButton').addEventListener('click', () => {
  applauseSound.pause();
  applauseSound.currentTime = 0;
  confettiCanvas.style.display = 'none';
  confettis = [];

  winnerScreen.classList.remove('active');
  menu.classList.add('active');
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
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
