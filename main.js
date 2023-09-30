WIDTH = 1920;
HEIGHT = 1080;

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getRandomInt(min, max) { // min and max included
  if (typeof max === 'undefined') {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
}

let DEBUG = location && location.hostname==='localhost';

let ctx, debugLog;

const stars = [];
function generateStarfield() {
  for (let i=0; i<1000; i++) {
    const b = getRandomInt(0, 255); // brightness
    const dR = getRandomInt(0, 50);
    const dG = getRandomInt(0, 50);
    const dB = getRandomInt(0, 50);
    stars.push({
      x: getRandomInt(0, WIDTH),
      y: getRandomInt(0, HEIGHT),
      size: Math.random() < 0.3 ? getRandomInt(1, 3) : 1,
      color: `rgb(${b+dR}, ${b+dG}, ${b+dB})`
    });
  }
}

const player = {
  ships: [{
    x: 300,
    y: 400
  }]
};

const planets = [
  {
    x: 1500,
    y: 300
  },
  {
    x: 500,
    y: 800
  }
];

function drawFrame(timestamp) {
  ctx.save();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // TODO: move to separate canvas and single step
  stars.forEach(s=>{
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  player.ships.forEach(s=>{
    ctx.fillStyle = 'white';
    ctx.fillRect(s.x, s.y, 50, 50);
  });

  planets.forEach(p=>{
    ctx.fillStyle = 'brown';
    ctx.arc(p.x, p.y, 50, 0, 2*Math.PI);
    ctx.fill();
  });

  requestAnimationFrame(drawFrame);
}

$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  debugLog = $(document.getElementById('debug-log'));

  ctx.fillStyle = '#88DD88';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // blast off
  generateStarfield();
  drawFrame(0);
});
