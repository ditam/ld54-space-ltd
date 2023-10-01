
const planets = [
  {
    name: 'P1',
    x: 1500,
    y: 300,
    contracts: [{
      contractID: getNewID(),
      price: 500,
      destination: 'P2',
      cargo: [
        [0, 1],
        [0, 1],
        [1, 1]
      ]
    }, {
      contractID: getNewID(),
      price: 120,
      destination: 'P2',
      cargo: [
        [2, 2],
        [0, 2],
        [2, 2]
      ]
    }, {
      contractID: getNewID(),
      price: 800,
      destination: 'P3',
      cargo: [
        [0, 4],
        [4, 4],
        [4, 0]
      ]
    }]
  },
  {
    name: 'P2',
    x: 500,
    y: 800,
    contracts: [{
      contractID: getNewID(),
      price: 100,
      destination: 'P1',
      cargo: [
        [2, 2],
        [2, 2]
      ]
    }]
  }
];

const player = {
  score: 0, // aka money
  ships: [{
    name: 'SLC Manaca',
    x: 300,
    y: 450,
    cargo: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    items: []
  },
  {
    name: 'SLC Debugio',
    x: 500,
    y: 800,
    cargo: [
      [0, 0],
      [0, 0]
    ],
    items: [],
    target: planets[1]
  }]
};

function checkDeliveriesAtPlanet(ship, planet) {
  console.assert(ship.inOrbitAt === planet);
  ship.items.forEach(item => {
    if (item.destination === planet.name) {
      item.toBeDeleted = true;
      player.score += item.price;
      updateScore();
      console.log('delivered item, credited:', item.price);
    }
  });
  for (let i=ship.items.length-1; i>=0; i--) {
    if (ship.items[i].toBeDeleted) {
      ship.items.splice(i, 1);
      console.log('removing delivered item from cargo');
    }
  }
  recalculateCargoSpace(ship);
}

function showInventoryAtPlanet(planet) {
  console.log('inventory at planet:', planet.name);
}

function updateOrbitInfo() {
  console.log('--orbits update--');
  const shipInventories = $('.inventory.ships');
  shipInventories.each((_i, _el) => {
    const el = $(_el);
    const planet = el.data('planet');
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
      const shipCargoDOM = getCargoDOM(s.cargo);
      shipCargoDOM.data('ship', s);
      container.append(shipCargoDOM);
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
          checkDeliveriesAtPlanet(s, s.target);
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
  scoreCounter = $(document.getElementById('score-counter'));

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
        rotateDraggedItem();
      }
    }
  });

  // blast off
  generateStarfield();
  updateScore();
  generatePlanetInfoPanels();
  drawFrame(0);
});
