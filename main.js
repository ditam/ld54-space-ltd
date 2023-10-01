WIDTH = 1920;
HEIGHT = 1080;
BASE_SPEED = 4;
ORBIT_DIST = 50;

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
function deepCopy(o) {
  return JSON.parse(JSON.stringify(o));
}

let DEBUG = location && location.hostname==='localhost';

let body, container, ctx, debugLog;

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
let floatingCargo = null;
function attachCargoToCursor(cargo) {
  console.assert(Array.isArray(cargo));
  floatingCargo = deepCopy(cargo);
  // TODO: register where cargo was picked from - so we know what to remove
  floater.empty();
  body.addClass('dragging');
  _floaterVisible = true;
  floater.css({
    top: mouseY + 10 + 'px',
    left: mouseX + 10 + 'px'
  });
  const table = getCargoDOM(cargo);
  table.appendTo(floater);
  floater.appendTo(container);
  floater.show();
}

function rotateFloatingCargo() {
  // rotate layout
  const oldCargo = deepCopy(floatingCargo);
  const oldRowCount = oldCargo.length;
  const oldColCount = oldCargo[0].length;
  const rowCount = oldColCount;
  const colCount = oldRowCount;
  const newCargo = [];
  // we rotate by transposing then reversing rows
  for (let i=0; i<rowCount; i++) {
    newCargo.push([]);
    for (let j=0; j<colCount; j++) {
      newCargo[i][j] = oldCargo[j][i];
    }
  }
  for (let i=0; i<rowCount; i++) {
    newCargo[i].reverse();
  }
  floatingCargo = newCargo;
  // redraw floater
  floater.empty();
  const table = getCargoDOM(floatingCargo);
  table.appendTo(floater);
}

function dropCargoFromCursor(cargo, clickEvent) {
  floater.hide();
  body.removeClass('dragging');
  _floaterVisible = false;
  floatingCargo = null;
  // TODO: register dropped floatingCargo
  console.log('dropped:', cargo);
}

function getCargoDOM(cargo) {
  console.assert(Array.isArray(cargo));
  const table = $('<div></div>').addClass('table');
  for (let i=0; i<cargo.length; i++) {
    let row = $('<div></div>').addClass('row');
    for (let j=0; j<cargo[0].length; j++) {
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
    const planetInventory = $('<div></div>').addClass('inventory');
    planetInventory.css({
      top: p.y - 30 + 'px',
      left: p.x - 180 + 'px'
    });
    const planetHeader = $('<div></div>').text(p.name).appendTo(planetInventory);

    // TODO: support multiple contracts
    const table = getCargoDOM(p.contracts[0].cargo);
    table.appendTo(planetInventory);
    table.on('click', ()=>{
      console.log('picking up:', p.contracts[0].cargo);
      attachCargoToCursor(p.contracts[0].cargo);
    });

    const shipInventory = $('<div></div>').addClass(['inventory', 'ships']);
    shipInventory.data('planet', p);
    shipInventory.on('click', (event)=>{
      dropCargoFromCursor(p.contracts[0].cargo, event);
    });
    const shipHeader = $('<div></div>').addClass('header').appendTo(shipInventory);
    shipHeader.text('No ships in orbit.');
    $('<div></div>').addClass('container').appendTo(shipInventory); // ship cargo will appear here

    shipInventory.css({
      top: p.y - 30 + 'px',
      left: p.x + 60 + 'px'
    });

    planetInventory.appendTo(container);
    shipInventory.appendTo(container);
    // TODO: hide by default
  });
}

const planets = [
  {
    name: 'P1',
    x: 1500,
    y: 300,
    contracts: [{
      price: 500,
      cargo: [
        [0, 1],
        [0, 1],
        [1, 1]
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

const player = {
  ships: [{
    name: 'SLC Manaca',
    x: 300,
    y: 400,
    cargo: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 1]
    ]
  },
  {
    name: 'SLC Debugio',
    x: 500,
    y: 800,
    cargo: [
      [0, 0],
      [0, 0]
    ],
    target: planets[1]
  }]
};

function showInventoryAtPlanet(planet) {
  console.log('inventory at planet:', planet.name);
}

function updateOrbitInfo() {
  console.log('--orbits update--');
  const shipInventories = $('.inventory.ships');
  shipInventories.each((_i, _el) => {
    const el = $(_el);
    const planet = el.data('planet');
    console.log('ship inv at planet:', planet);
    const shipsAtPlanet = player.ships.filter(s=>s.inOrbitAt === planet);
    let headerText = '';
    if (shipsAtPlanet.length === 0) {
      headerText = 'No ships in orbit.';
    } else if (shipsAtPlanet.length === 1) {
      headerText = shipsAtPlanet[0].name + ' is in orbit.';
    } else {
      headerText = shipsAtPlanet.length + ' ships in orbit.';
    }
    el.find('.header').text(headerText);
    const container = el.find('.container');
    // TODO: this is all very wasteful. We should just generate off-screen
    // the cargo view, and move it to the planet where the ship is.
    container.empty();
    shipsAtPlanet.forEach(s=>{
      if (shipsAtPlanet.length > 1) {
        $(`<div>${s.name}</div>`).addClass('name').appendTo(container);
      }
      container.append(getCargoDOM(s.cargo));
    });
  });
}

function _getDebugLog(){
  let shipData = deepCopy(player.ships[0]);
  shipData.x = Math.round(shipData.x);
  shipData.y = Math.round(shipData.y);
  return JSON.stringify(shipData);
}

function drawFrame(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (DEBUG) {
    debugLog.text(_getDebugLog());
  }

  // draw planets
  planets.forEach(p=>{
    ctx.fillStyle = 'brown';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 50, 0, 2*Math.PI);
    ctx.fill();
  });

  let newOrbitData = false;
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
      if (dist > ORBIT_DIST) {
        s.x += dX * BASE_SPEED;
        s.y += dY * BASE_SPEED;
        if (s.inOrbitAt) {
          newOrbitData = true;
          delete s.inOrbitAt;
        }
      } else {
        if (s.inOrbitAt !== s.target) {
          newOrbitData = true;
          s.inOrbitAt = s.target;
          showInventoryAtPlanet(s.target);
        }
      }
      if (newOrbitData) {
        updateOrbitInfo();
      }
    }

    // draw ship
    ctx.fillStyle = 'gray';
    ctx.fillRect(s.x, s.y, 40, 40);
  });

  requestAnimationFrame(drawFrame);
}

let mouseX = 0;
let mouseY = 0;
$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  body = $('body');
  container = $(document.getElementById('overlay-container'));
  debugLog = $(document.getElementById('debug-log'));
  floater = $(document.getElementById('floater'));

  ctx.fillStyle = '#88DD88';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // attach mouse events
  document.addEventListener('mousemove', function(event){
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (_floaterVisible) {
      floater.css({
        top: mouseY + 10 + 'px',
        left: mouseX + 10 + 'px'
      });
    }
  }, false);

  document.addEventListener('contextmenu', function(event) {
    if (event.button === 2) { // right click
      event.preventDefault(); // disable context menu
      if (_floaterVisible) {
        rotateFloatingCargo();
      }
    }
  });

  // blast off
  generateStarfield();
  generateDOM();
  drawFrame(0);
});
