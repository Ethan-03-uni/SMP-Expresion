let palabras = [];
let turno = 'rojo';
let puntos = { rojo: 0, azul: 0 };
let temporizador;
let tiempoTotal;
let rondaActiva = false;
let ticInterval;

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
  return palabras[Math.floor(Math.random() * palabras.length)];
}

function nuevaRonda() {
  rondaActiva = true;
  tiempoTotal = Math.random() * 7000 + 5000; // 5–12 s
  clearTimeout(temporizador);
  clearInterval(ticInterval);
  iniciarTicTac();
  temporizador = setTimeout(explotar, tiempoTotal);
  cambiarTurno();
  wordElem.textContent = palabraAleatoria();
  wordElem.style.fontSize = "3em";
}

function iniciarTicTac() {
  const start = performance.now();
  const reproducirTic = () => {
    const elapsed = performance.now() - start;
    const progreso = elapsed / tiempoTotal;

    // velocidad del tic-tac según progreso
    let intervalo = 1000;
    if (progreso > 0.5) intervalo = 700;
    if (progreso > 0.7) intervalo = 400;
    if (progreso > 0.85) intervalo = 200;

    ticSound.currentTime = 0;
    ticSound.play().catch(() => {});

    ticInterval = setTimeout(reproducirTic, intervalo);
  };
  reproducirTic();
}

function pararTicTac() {
  clearTimeout(ticInterval);
}

function explotar() {
  rondaActiva = false;
  pararTicTac();

  bellSound.currentTime = 0;
  bellSound.play().catch(() => {});

  let ganador = turno === 'rojo' ? 'azul' : 'rojo';
  puntos[ganador]++;
  actualizarPuntos();

  if (puntos[ganador] >= 3) {
    mostrarGanador(ganador);
  } else {
    // Mostrar fin de ronda y esperar clic para iniciar siguiente
    wordElem.textContent = `${ganador.toUpperCase()} gana la ronda 🎉`;
    wordElem.style.fontSize = "2em";
    wordElem.style.transition = "opacity 0.5s ease";
    game.dataset.nextRoundReady = "true";
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

  bellSound.currentTime = 0;
  bellSound.play().catch(() => {});
  setTimeout(() => applauseSound.play().catch(() => {}), 500);

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

document.getElementById('playButton').addEventListener('click', async () => {
  menu.classList.remove('active');
  game.classList.add('active');
  await cargarPalabras();
  nuevaRonda();
});

document.getElementById('restartButton').addEventListener('click', () => {
  winnerScreen.classList.remove('active');
  menu.classList.add('active');
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  confettis = [];
});

game.addEventListener('click', () => {
  if (!rondaActiva) {
    if (game.dataset.nextRoundReady === "true") {
      game.dataset.nextRoundReady = "false";
      nuevaRonda();
      return;
    }
    return;
  }
  cambiarTurno();
  wordElem.textContent = palabraAleatoria();
});

addEventListener('resize', () => {
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
});

animarConfeti();
