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

let container, ctx, debugLog;

function generateStarfield() {
  console.log('starfield init');
  const stars = [];
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

  const sfCanvas = document.getElementById('bg-canvas');
  $(sfCanvas).attr('height', HEIGHT);
  $(sfCanvas).attr('width', WIDTH);

  const sfCtx = sfCanvas.getContext('2d');
    // TODO: move to separate canvas and single step
  stars.forEach(s=>{
    sfCtx.fillStyle = s.color;
    sfCtx.fillRect(s.x, s.y, s.size, s.size);
  });
}

const player = {
  ships: [{
    x: 300,
    y: 400,
    cargo: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]
  }]
};

const planets = [
  {
    name: 'P1',
    x: 1500,
    y: 300
  },
  {
    name: 'P2',
    x: 500,
    y: 800
  }
];

function drawFrame(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

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

function generateButtons() {
  planets.forEach(p=>{
    const button = $('<div>go</div>').addClass('button');
    button.css({
      top: p.y + 'px',
      left: p.x + 'px'
    });
    button.data('planet', p);
    button.appendTo(container);
    button.on('click', () => {
      console.log('button for planet:', p);
    });
  });
}

$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  container = $(document.getElementById('overlay-container'));
  debugLog = $(document.getElementById('debug-log'));

  ctx.fillStyle = '#88DD88';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // blast off
  generateStarfield();
  generateButtons();
  drawFrame(0);
});
