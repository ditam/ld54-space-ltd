
let activeShipIndex = 0;
const planets = [
  {
    name: 'Siracusa III',
    x: 1300,
    y: 350,
    contracts: [{
      contractID: getNewID(),
      price: 500,
      destination: 'Agrigento VI',
      cargo: [
        [0, 1],
        [0, 1],
        [1, 1]
      ]
    }, {
      contractID: getNewID(),
      price: 120,
      destination: 'Agrigento VI',
      cargo: [
        [2, 2],
        [0, 2],
        [2, 2]
      ]
    }, {
      contractID: getNewID(),
      price: 800,
      destination: 'Echion',
      cargo: [
        [0, 4],
        [4, 4],
        [4, 0]
      ]
    }]
  },
  {
    name: 'Agrigento VI',
    x: 500,
    y: 800,
    contracts: [{
      contractID: getNewID(),
      price: 100,
      destination: 'Siracusa III',
      cargo: [
        [2, 2],
        [2, 2]
      ]
    }]
  },  {
    name: 'Echion',
    type: 'moon',
    orbitSize: 200,
    x: 1300,
    y: 350,
    contracts: []
  }
];

// convenience hashmap for storing a planet's DOM references
// (storing them on the planet object would make them non-copyable)
const planet2DOM = {};
planets.forEach(p=>{
  planet2DOM[p.name] = {};
});

const ship0Image = $('<img>').attr('src', 'assets/ship1.png');
const ship1Image = $('<img>').attr('src', 'assets/ship2.png');
const ship2Image = $('<img>').attr('src', 'assets/ship3.png');
function getShipImageClone(i) {
  console.assert(i < 3);
  return [ship0Image, ship1Image, ship2Image][i].clone().get(0);
}

const player = {
  score: 0, // aka money
  ships: [{
    name: 'SLC Manaca',
    image: getShipImageClone(0),
    x: 300,
    y: 450,
    cargo: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
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

  // show/hide panels based on ship orbits
  planets.forEach(p => {
    if (p.comlinkOn) {
      showPlanetInfo(p);
      return;
    }
    let shipsInOrbitCount = 0;
    player.ships.forEach(s => {
      if (s.inOrbitAt === p) {
        shipsInOrbitCount++;
      }
    });
    if (shipsInOrbitCount > 0) {
      showPlanetInfo(p);
    } else {
      hidePlanetInfo(p);
    }
  });

  updateShipList();
}

function _getDebugLog(){
  let shipData = deepCopy(player.ships[activeShipIndex]);
  shipData.x = Math.round(shipData.x);
  shipData.y = Math.round(shipData.y);
  return JSON.stringify(shipData);
}

function drawFrame(timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (DEBUG) {
    debugLog.text(_getDebugLog());
  }

  // TODO: make moon-specific with orbit size? Might be too much work
  const time = timestamp/(75 * 1000); // orbit duration
  const moonDX = Math.sin(time%2*Math.PI) * 200;
  const moonDY = Math.cos(time%2*Math.PI) * 200;

  // draw planets
  planets.forEach(p=>{
    if (p.type === 'moon') {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(p.x + moonDX, p.y + moonDY, 20, 0, 2*Math.PI);
      planet2DOM[p.name].dom1.css({
        top: p.y + moonDY - 60 + 'px',
        left: p.x + moonDX - 100 + 'px'
      });
      planet2DOM[p.name].dom2.css({
        top: p.y + moonDY - 30 + 'px',
        left: p.x + moonDX - 180 + 'px'
      });
      planet2DOM[p.name].dom3.css({
        top: p.y + moonDY - 30 + 'px',
        left: p.x + moonDX + 60 + 'px'
      });
      ctx.fill();
    } else {
      ctx.fillStyle = 'brown';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 50, 0, 2*Math.PI);
      ctx.fill();
    }
  });

  let newOrbitData = false;
  player.ships.forEach(s=>{
    // move towards target
    if (s.target) {
      let t = s.target;
      let dX, dY;
      if (s.target.type === 'moon') {
        dX = t.x + moonDX - s.x;
        dY = t.y + moonDY - s.y;
      } else {
        dX = t.x - s.x;
        dY = t.y - s.y;
      }
      const dist = Math.sqrt(dX*dX + dY*dY);
      // dX/dY is the unit vector pointing at target
      dX = dX / dist;
      dY = dY / dist;
      if (dist > ORBIT_DIST) {
        // en-route to orbit
        s.x += dX * BASE_SPEED;
        s.y += dY * BASE_SPEED;
        if (s.inOrbitAt) {
          // leaving orbit
          newOrbitData = true;
          delete s.inOrbitAt;
        }
        // draw ship - ships are only visible en-route to an orbit
        ctx.drawImage(s.image, s.x, s.y, 32, 32);
      } else {
        // at orbit
        if (s.inOrbitAt !== s.target) {
          // entering orbit
          newOrbitData = true;
          s.inOrbitAt = s.target;
          checkDeliveriesAtPlanet(s, s.target);
        }
        // stick / snap to orbited planet
        if (s.target.type === 'moon') {
          s.x = s.target.x + moonDX;
          s.y = s.target.y + moonDY;
        } else {
          s.x = s.target.x;
          s.y = s.target.y;
        }
      }
      if (newOrbitData) {
        updateOrbitInfo();
      }
    }
  });

  requestAnimationFrame(drawFrame);
}

let mouseX = 0;
let mouseY = 0;
let songs, errorSound;
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

  // audio assets
  songs = [
    new Audio('assets/sounds/bgSong01.mp3')
  ];

  errorSound = new Audio('assets/sounds/error.mp3');

  const sounds = [
    errorSound,
  ];

  let audioLoadCount = 0;
  $('.loadCountTotal').text(songs.length + sounds.length);
  function countWhenLoaded(audioElement) {
    audioElement.addEventListener('canplaythrough', function() {
      audioLoadCount++;
      $('.loadCount').text(audioLoadCount);
    }, false);
  }

  songs.forEach(countWhenLoaded);
  sounds.forEach(countWhenLoaded);

  // we add some extra songs to the list - these need not block initial loading
  songs.push(new Audio('assets/sounds/bgSong02.mp3'));
  songs.push(new Audio('assets/sounds/bgSong03.mp3'));

  // we set up autoplay so the songs loop
  songs.forEach(function(song, i) {
    song.addEventListener('ended', function() {
      this.currentTime = 0;
      playNextSong();
    }, false);
  });

  let currentSongIndex = -1; // -1 so first call toggles to index 0
  function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % 2;
    songs[currentSongIndex].play();
  }

  // attach mouse events
  const splash = $('#splash');
  splash.on('click', function(){
    playNextSong();
    splash.remove();
  });

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

  document.addEventListener('keydown', function(event) {
    if (event.key === '1') {
      activeShipIndex = 0;
      updateShipList();
    }
    // TODO: block if ship count < 2
    if (event.key === '2') {
      activeShipIndex = 1;
      updateShipList();
    }
  });

  // blast off
  generateStarfield();
  generateHUD();
  updateScore();
  generatePlanetInfoPanels();
  drawFrame(0);

  if (DEBUG) {
    player.score = 5000;
    updateScore();
  }
});
