let palabras = [];
let turno = 'rojo';
let puntos = { rojo: 0, azul: 0 };
let temporizador;
let tiempoRestante;
let rondaActiva = false;

const menu = document.getElementById('menu');
const game = document.getElementById('game');
const winnerScreen = document.getElementById('winnerScreen');
const wordElem = document.getElementById('word');
const scoreRed = document.getElementById('scoreRed');
const scoreBlue = document.getElementById('scoreBlue');
const confettiCanvas = document.getElementById('confettiCanvas');
const winnerText = document.getElementById('winnerText');

const ctx = confettiCanvas.getContext('2d');
confettiCanvas.width = innerWidth;
confettiCanvas.height = innerHeight;

let confettis = [];

async function cargarPalabras() {
  const res = await fetch('palabras.txt');
  const text = await res.text();
  palabras = text.split('\n').map(p => p.trim()).filter(Boolean);
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
  wordElem.textContent = palabraAleatoria();
  cambiarTurno();
  let duracion = Math.random() * 7000 + 5000; // entre 5 y 12s
  clearTimeout(temporizador);
  temporizador = setTimeout(explotar, duracion);
}

function explotar() {
  rondaActiva = false;
  let ganador = turno === 'rojo' ? 'azul' : 'rojo';
  puntos[ganador]++;
  actualizarPuntos();
  lanzarConfeti();
  if (puntos[ganador] >= 3) {
    mostrarGanador(ganador);
  } else {
    wordElem.textContent = `${ganador.toUpperCase()} gana la ronda 🎉`;
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
}

function lanzarConfeti() {
  for (let i = 0; i < 100; i++) {
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
  if (rondaActiva) {
    nuevaRonda();
  } else {
    nuevaRonda();
  }
});

addEventListener('resize', () => {
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
});

animarConfeti();
