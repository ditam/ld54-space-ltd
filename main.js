WIDTH = 1920;
HEIGHT = 1080;
BASE_SPEED = 4;
INTERACTION_SIZE = 50;

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

let _floaterVisible = false;
function attachCargoToCursor(cargo) {
  floater.empty();
  floater.show();
  _floaterVisible = true;
  const table = getCargoDOM(cargo);
  table.appendTo(floater);
  floater.appendTo(container);
}

function dropCargoFromCursor(cargo, clickEvent) {
  floater.hide();
  _floaterVisible = false;
  console.log('dropped:', cargo);
}

function getCargoDOM(cargo) {
  console.assert(Array.isArray(cargo));
  const table = $('<div></div>').addClass('table');
  for (let i=0; i<4; i++) {
    let row = $('<div></div>').addClass('row');
    for (let j=0; j<4; j++) {
      let cell = $('<div></div>').addClass('cell');
      // TODO: display at minimum necessary size
      if (cargo[i] && cargo[i][j] === 1) {
        cell.addClass('filled');
      }
      cell.appendTo(row);
    }
    row.appendTo(table);
  }
  return table;
}

function generateDOM() {
  planets.forEach(p=>{
    // generate buttons
    const button = $('<div>go</div>').addClass('button');
    button.css({
      top: p.y + 'px',
      left: p.x + 'px'
    });
    button.data('planet', p);
    button.appendTo(container);
    button.on('click', () => {
      player.ships[0].target = p;
    });
    // generate inventory
    const inventory = $('<div></div>').addClass('inventory');
    inventory.css({
      top: p.y + 30 + 'px',
      left: p.x + 30 + 'px'
    });
    $('<div>header</div>').appendTo(inventory);

    // TODO: support multiple contracts
    const table = getCargoDOM(p.contracts[0].cargo);
    table.appendTo(inventory);
    table.on('click', ()=>{
      console.log('picking up:', p.contracts[0].cargo);
      attachCargoToCursor(p.contracts[0].cargo);
    });

    const dropzone = $('<div></div>').addClass('dropzone');
    dropzone.appendTo(inventory);
    dropzone.on('click', (event)=>{
      dropCargoFromCursor(p.contracts[0].cargo, event);
    });

    inventory.appendTo(container);
    // TODO: hide by default
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
    y: 300,
    contracts: [{
      price: 500,
      cargo: [
        [0, 0, 1],
        [0, 0, 1],
        [0, 1, 1]
      ]
    }]
  },
  {
    name: 'P2',
    x: 500,
    y: 800,
    contracts: [{
      price: 100,
      cargo: [
        [1, 1],
        [1, 1]
      ]
    }]
  }
];

let cargoShown = false;
function showCargoAtPlanet(planet) {
  if (!cargoShown) {
    console.log('cargo at planet:', planet.name);
    cargoShown = true;
  }
}

function drawFrame(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // draw planets
  planets.forEach(p=>{
    ctx.fillStyle = 'brown';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 50, 0, 2*Math.PI);
    ctx.fill();
  });

  player.ships.forEach(s=>{
    // move towards target
    if (s.target) {
      let t = s.target;
      let dX = t.x - s.x;
      let dY = t.y - s.y;
      const dist = Math.sqrt(dX*dX + dY*dY);
      // dX/dY is the unit vector pointing at target
      dX = dX / dist;
      dY = dY / dist;
      if (dist > INTERACTION_SIZE) {
        s.x += dX * BASE_SPEED;
        s.y += dY * BASE_SPEED;
      } else {
        showCargoAtPlanet(s.target);
      }
    }

    // draw ship
    ctx.fillStyle = 'white';
    ctx.fillRect(s.x, s.y, 50, 50);
  });

  requestAnimationFrame(drawFrame);
}

$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  container = $(document.getElementById('overlay-container'));
  debugLog = $(document.getElementById('debug-log'));
  floater = $(document.getElementById('floater'));

  ctx.fillStyle = '#88DD88';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // attach mouse events
  document.addEventListener('mousemove', function(event){
    if (_floaterVisible) {
      floater.css({
        top: event.clientY + 10 + 'px',
        left: event.clientX + 10 + 'px'
      });
    }
  }, false);

  // blast off
  generateStarfield();
  generateDOM();
  drawFrame(0);
});
