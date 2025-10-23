// script.js (versión corregida)
let palabras = [];
let turno = 'rojo';
let puntos = { rojo: 0, azul: 0 };
let temporizadorId = null;    // timeout id para finalizar ronda
let ticTimeoutId = null;      // timeout id para tic-tac (usamos setTimeout recursivo)
let tiempoTotal = 0;
let rondaActiva = false;
let nextRoundReady = false;   // indicador claro de que se puede empezar la siguiente ronda

const menu = document.getElementById('menu');
const game = document.getElementById('game');
const winnerScreen = document.getElementById('winnerScreen');
const wordElem = document.getElementById('word');
const scoreRed = document.getElementById('scoreRed');
const scoreBlue = document.getElementById('scoreBlue');
const confettiCanvas = document.getElementById('confettiCanvas');
const winnerText = document.getElementById('winnerText');

const ticSound = document.getElementById('ticSound');             // <audio id="ticSound" ...>
const bellSound = document.getElementById('bellSound');           // <audio id="bellSound" ...>
const applauseSound = document.getElementById('applauseSound');   // <audio id="applauseSound" ...>

const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = innerWidth;
confettiCanvas.height = innerHeight;

let confettis = [];

async function cargarPalabras() {
  const res = await fetch('palabras.txt');
  const text = await res.text();
  // soporta expresiones con espacios; líneas vacías ignoradas
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
  // inicia una nueva ronda completa (temporizador aleatorio una vez por ronda)
  rondaActiva = true;
  nextRoundReady = false;

  // elegir duración aleatoria 5 - 12 s
  tiempoTotal = Math.random() * 7000 + 5000;

  // limpiar posibles timeouts previos
  if (temporizadorId) {
    clearTimeout(temporizadorId);
    temporizadorId = null;
  }
  if (ticTimeoutId) {
    clearTimeout(ticTimeoutId);
    ticTimeoutId = null;
  }

  // inicio tic-tac y timeout de explosión
  iniciarTicTac();
  temporizadorId = setTimeout(explotar, tiempoTotal);

  // cambiar el color/turno SOLO al empezar nueva ronda (por diseño)
  cambiarTurno();

  // mostrar palabra grande en el centro
  wordElem.textContent = palabraAleatoria();
  wordElem.style.opacity = '1';
  wordElem.style.fontSize = '3em';
  // ocultar posible aviso anterior
  wordElem.classList.remove('pulse-hint');
}

function iniciarTicTac() {
  const startTime = performance.now();

  // función recursiva que ajusta su propio intervalo
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const progreso = Math.min(1, elapsed / tiempoTotal); // 0..1

    // ajusta intervalo de tic según progreso (se acelera al final)
    // base 900ms -> 700 -> 450 -> 220 -> 120ms
    let intervalo = 900;
    if (progreso > 0.5) intervalo = 700;
    if (progreso > 0.7) intervalo = 450;
    if (progreso > 0.85) intervalo = 220;
    if (progreso > 0.95) intervalo = 120;

    // reproducir tic (manejo de promesa para evitar errores)
    try {
      ticSound.currentTime = 0;
      ticSound.play().catch(() => {});
    } catch (e) {
      // algunos navegadores bloquean autoplay si no hubo interacción; lo ignoramos
    }

    // programar siguiente tic solo si la ronda sigue activa
    if (rondaActiva) {
      ticTimeoutId = setTimeout(tick, intervalo);
    }
  };

  // lanzar el primer tick inmediatamente
  tick();
}

function pararTicTac() {
  if (ticTimeoutId) {
    clearTimeout(ticTimeoutId);
    ticTimeoutId = null;
  }
}

function explotar() {
  // fin de la ronda (no de la partida necesariamente)
  rondaActiva = false;
  pararTicTac();

  // detener timeout por si algo quedó (defensivo)
  if (temporizadorId) {
    clearTimeout(temporizadorId);
    temporizadorId = null;
  }

  // sonar campana corta (manejo seguro de reproducción)
  try {
    bellSound.currentTime = 0;
    bellSound.play().catch(() => {});
  } catch (e) {}

  // determinar ganador de la ronda (equipo contrario al que tenía la palabra)
  const ganador = turno === 'rojo' ? 'azul' : 'rojo';
  puntos[ganador]++;
  actualizarPuntos();

  // mostrar resultado de la ronda y permitir avanzar con click
  if (puntos[ganador] >= 3) {
    // partida finalizada: mostrar ganador completo
    mostrarGanador(ganador);
  } else {
    // fin de ronda: texto y espera de click
    wordElem.textContent = `${ganador.toUpperCase()} gana la ronda 🎉\n(Pulsa para siguiente)`;
    wordElem.style.fontSize = '1.6em';
    // pequeño estilo visual para indicar que se puede pulsar
    wordElem.classList.add('pulse-hint');
    nextRoundReady = true;
  }
}

function actualizarPuntos() {
  scoreRed.textContent = `🔴 ${puntos.rojo}`;
  scoreBlue.textContent = `🔵 ${puntos.azul}`;
}

function mostrarGanador(equipo) {
  // reproducir campana + aplausos, lanzar confeti y mostrar pantalla de ganador
  game.classList.remove('active');
  winnerScreen.classList.add('active');
  winnerText.textContent = `¡${equipo.toUpperCase()} GANA! 🎊`;

  try {
    bellSound.currentTime = 0;
    bellSound.play().catch(() => {});
  } catch (e) {}

  // aplausos poco después (pequeño delay)
  setTimeout(() => {
    try {
      applauseSound.currentTime = 0;
      applauseSound.play().catch(() => {});
    } catch (e) {}
  }, 500);

  lanzarConfeti();
}

// --- Confetti (igual que antes) ---
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

// --- Listeners UI ---
document.getElementById('playButton').addEventListener('click', async () => {
  menu.classList.remove('active');
  game.classList.add('active');
  await cargarPalabras();
  // reset puntos por si venimos de reinicio
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  nuevaRonda();
});

document.getElementById('restartButton').addEventListener('click', () => {
  winnerScreen.classList.remove('active');
  menu.classList.add('active');
  puntos = { rojo: 0, azul: 0 };
  actualizarPuntos();
  confettis = [];
});

// Click / tap en la pantalla de juego
game.addEventListener('click', () => {
  // si la ronda activa -> cambiar palabra y pasar turno
  if (rondaActiva) {
    cambiarTurno();
    wordElem.textContent = palabraAleatoria();
    return;
  }

  // si la ronda ha terminado y estamos listos para la siguiente -> iniciarla
  if (nextRoundReady) {
    nextRoundReady = false;
    // iniciar nueva ronda sin cambiar puntos (la función nuevaRonda ya cambia el turno)
    nuevaRonda();
  }
});

// resize canvas confetti
addEventListener('resize', () => {
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
});

// animación continua confetti
animarConfeti();
