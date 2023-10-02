/* Shared constants, utils, globals and state vars. We are jamming! */

WIDTH = 1920;
HEIGHT = 1080;
BASE_SPEED = 6;
ORBIT_DIST = 50;

let _idCounter = 0;
function getNewID() {
  _idCounter++;
  return 'id' + _idCounter;
}

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

let body, buyShipButton, container, ctx, debugLog, scoreCounter, shipList;

let startfieldInitialized = false;
function generateStarfield() {
  console.assert(!startfieldInitialized, 'starfield already initialized');
  startfieldInitialized = true;
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

let hudInitialized = false;
function generateHUD() {
  console.assert(!hudInitialized);
  hudInitialized = true;

  const hud = $('<div id="hud"></div>').addClass('hud');
  shipList = $('<div></div>').addClass('ship-list');
  scoreCounter = $('<div></div>').addClass('score-counter');
  hud.append(shipList);
  hud.append(scoreCounter);

  player.ships.forEach((ship, i) => {
    generateShipPanelForHUD(shipList, ship, i);
  });

  buyShipButton = $('<div></div>').addClass('buy-button').text('+');
  buyShipButton.on('click', showShipBuyingPanel);
  buyShipButton.appendTo(shipList);

  hud.appendTo(body);
}

const shipNames = [
  'SLC Manaca',
  'SLC Ondorre',
  'SLC Branao',
  'SLC Votocan',
  'SLC Kawaet',
  'SLC Qetor',
  'SLC Malto'
];
function showShipBuyingPanel() {
  const msgContainer = $('<div></div>').addClass('msg-container ship-buying');
  const msgText = $('<div></div>').addClass('msg-body').text('Select a ship to buy:');
  msgText.appendTo(msgContainer);

  const shipsForSale = [
    {
      type: 'light cargo',
      cargoSpace: '3x3',
      cost: 1000,
      image: getShipImageClone(0),
      cargo: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
    },
    {
      type: 'heavy cargo',
      cargoSpace: '4x4',
      cost: 2500,
      image: getShipImageClone(1),
      cargo: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
    },
    {
      type: 'speedster',
      cargoSpace: '2x1',
      cost: 1500,
      image: getShipImageClone(2),
      cargo: [
        [0],
        [0],
      ],
    }
  ];

  shipsForSale.forEach(s => {
    const shipButton = $('<div></div>').addClass('button full-width');
    shipButton.text(`Type: ${s.type}, cargo space: ${s.cargoSpace}, cost: $${s.cost}`);
    shipButton.appendTo(msgContainer);

    shipButton.on('click', () => {
      if (player.score >= s.cost) {
        player.score -= s.cost;
        updateScore();
        const newShip = {
          name: shipNames[player.ships.length],
          image: s.image,
          x: planets[0].x,
          y: planets[0].y,
          cargo: deepCopy(s.cargo),
          items: [],
          target: planets[0],
          inOrbitAt: planets[0]
        };
        player.ships.push(newShip);
        generateShipPanelForHUD(shipList, newShip, player.ships.length-1);
        buyShipButton.detach();
        buyShipButton.appendTo(shipList);
        updateOrbitInfo();
      } else {
        console.log('not enough money.');
        errorSound.play();
      }
      msgContainer.remove();
    });
  });

  const msgDismiss = $('<div></div>').addClass('msg-dismiss').text('Click here to dismiss.');
  msgDismiss.appendTo(msgContainer);

  msgDismiss.on('click', () => {
    msgContainer.remove();
  });

  msgContainer.appendTo(body);
}

function generateShipPanelForHUD(container, ship, index) {
  const shipEl = $('<div></div>').addClass('ship');
  if (ship.inOrbitAt) {
    shipEl.addClass('in-orbit');
  } else {
    shipEl.addClass('in-travel');
  }

  const shipName = $('<div></div>').addClass('ship-name').text(ship.name);
  const shipImg =  $('<div></div>').addClass('ship-img').append(ship.image);
  const moveIcon = $('<img src="assets/icons/in-travel.png"></img>').addClass('status in-travel');
  const orbitIcon = $('<img src="assets/icons/in-orbit.png"></img>').addClass('status in-orbit');
  const targetName = $('<div></div>').addClass('target-name').text(ship.target.name);

  shipEl.append(shipName);
  shipEl.append(shipImg);
  shipEl.append(moveIcon);
  shipEl.append(orbitIcon);
  shipEl.append(targetName);

  shipEl.on('click', () => {
    activeShipIndex = index;
    updateShipList();
  });

  container.append(shipEl);
}

function updateScore() {
  scoreCounter.text('$'+player.score);
}

function updateShipList() {
  const shipEls = shipList.find('.ship');
  shipEls.removeClass('active');
  shipEls.eq(activeShipIndex).addClass('active');12

  shipEls.removeClass('in-travel in-orbit');
  player.ships.forEach((s, i) => {
    shipEls.eq(i).find('.target-name').text(s.target.name);
    if (s.inOrbitAt) {
      shipEls.eq(i).addClass('in-orbit');
    } else {
      shipEls.eq(i).addClass('in-travel');
    }
  });
}

let _floaterVisible = false;
let draggedItem = null;
function attachItemToCursor(sourcePlanet, contract) {
  console.assert(Array.isArray(contract.cargo));
  draggedItem = deepCopy(contract);
  draggedItem.source = sourcePlanet;
  floater.empty();
  body.addClass('dragging');
  _floaterVisible = true;
  floater.css({
    top: mouseY + 10 + 'px',
    left: mouseX + 10 + 'px'
  });
  const table = getCargoDOM(contract.cargo);
  table.appendTo(floater);
  floater.appendTo(container);
  floater.show();
}

function rotateDraggedItem() {
  // rotate layout
  const oldCargo = deepCopy(draggedItem.cargo);
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
  draggedItem.cargo = newCargo;
  // redraw floater
  floater.empty();
  const table = getCargoDOM(draggedItem.cargo);
  table.appendTo(floater);
}

function dropItemFromCursor(ship, coords) {
  console.assert(draggedItem);
  console.log('dropping item:', draggedItem);
  const i0 = coords.i;
  const j0 = coords.j;

  let cargoFits = true;
  // We check if the cargo fits
  // - validate that it is at the right planet
  if (!ship.inOrbitAt || ship.inOrbitAt !== draggedItem.source) {
    console.log('Invalid target: ship not at source planet!');
    cargoFits = false;
  }
  // - check bounds size
  const draggedItemWidth = draggedItem.cargo[0].length;
  const draggedItemHeight = draggedItem.cargo.length;
  if ((i0 + draggedItemHeight -1) >= ship.cargo.length ) {
    console.log('height clash', i0, draggedItemHeight, ship.cargo.length);
    cargoFits = false;
  }
  if ((j0 + draggedItemWidth -1) >= ship.cargo[0].length) {
    console.log('width clash', j0, draggedItemWidth, ship.cargo[0].length);
    cargoFits = false;
  }
  // - check every cell if not yet filled
  for (let i=0; i<draggedItem.cargo.length; i++) {
    for (let j=0; j<draggedItem.cargo[i].length; j++) {
      if (ship.cargo[i0 + i] && ship.cargo[i0 + i][j0 + j] && draggedItem.cargo[i][j]) {
        console.log('clash with existing cargo at:', i0 + i, j0 + j, i, j);
        cargoFits = false;
      }
    }
  }

  if (!cargoFits) {
    // TODO: display error message somewhere
    console.log('Error: cargo does not fit.');
    errorSound.play();
  } else {
    // remove item from planet contracts
    const contractIndex = draggedItem.source.contracts.findIndex(c=>c.contractID === draggedItem.contractID);
    draggedItem.source.contracts.splice(contractIndex, 1);
    refreshPlanetContracts(draggedItem.source.contractsContainer, draggedItem.source);
    // add item to ship cargo
    ship.items.push({
      i0: i0,
      j0: j0,
      cells: deepCopy(draggedItem.cargo),
      destination: draggedItem.destination,
      price: draggedItem.price
    });
    recalculateCargoSpace(ship);
    // update displays
    updateOrbitInfo();
  }

  // exit dragging mode - even if it didnt fit
  floater.hide();
  body.removeClass('dragging');
  _floaterVisible = false;
  draggedItem = null;
}

function recalculateCargoSpace(ship) {
  // empty old cargo, keeping the size
  for (let i=0; i<ship.cargo.length; i++) {
    for (let j=0; j<ship.cargo[i].length; j++) {
      ship.cargo[i][j] = 0;
    }
  }
  ship.items.forEach(item=>{
    const i0 = item.i0;
    const j0 = item.j0;
    for (let i=0; i<item.cells.length; i++) {
      for (let j=0; j<item.cells[i].length; j++) {
        if (item.cells[i][j]) {
          console.assert(ship.cargo[i0+i][j0+j] === 0, 'Unexpected filled cargo cell at', i0+i, j0+j);
          ship.cargo[i0+i][j0+j] = item.cells[i][j];
        }
      }
    }
  });
}

function getCargoDOM(cargo) {
  console.assert(Array.isArray(cargo));
  const table = $('<div></div>').addClass('table');
  for (let i=0; i<cargo.length; i++) {
    let row = $('<div></div>').addClass('row');
    for (let j=0; j<cargo[0].length; j++) {
      let cell = $('<div></div>').addClass('cell');
      cell.data('coords', {i: i, j: j});
      // TODO: display at minimum necessary size
      if (cargo[i] && cargo[i][j]) {
        cell.addClass('filled');
        cell.addClass('color'+cargo[i][j]);
      }
      cell.appendTo(row);
    }
    row.appendTo(table);
  }
  return table;
}

function getCargoType(cargo) {
  console.assert(cargo);
  const typesMap = {
    1: 'Food',
    2: 'Equipment',
    3: 'Materials',
    4: 'Unknown'
  }
  for (let i=0; i<cargo[0].length; i++) {
    if (cargo[0][i] !== 0) {
      return typesMap[cargo[0][i]];
    }
  }
  console.assert(false, 'Expected valid cell in first row of cargo');
}

function refreshPlanetContracts(container, planet) {
  container.empty();
  planet.contracts.forEach(contract => {
    const contractContainer = $('<div></div>').addClass('contract-container');
    const table = getCargoDOM(contract.cargo);
    table.appendTo(contractContainer);
    table.on('click', ()=>{
      console.log('picking up:', contract);
      attachItemToCursor(planet, contract);
    });

    const details = $('<div></div>').addClass('details-container').appendTo(contractContainer);
    $('<div></div>').addClass('label destination-label').text('Destination:').appendTo(details);
    $('<div></div>').addClass('destination').text(contract.destination).appendTo(details);
    $('<div></div>').addClass('label price-label').text('Reward:').appendTo(details);
    $('<div></div>').addClass('price').text(contract.price).appendTo(details);
    $('<div></div>').addClass('label type-label').text('Cargo type:').appendTo(details);
    $('<div></div>').addClass('type').text(getCargoType(contract.cargo)).appendTo(details);

    contractContainer.appendTo(container);
  });
}

function showMessage(text, callback) {
  const msgContainer = $('<div></div>').addClass('msg-container');
  const msgText = $('<div></div>').addClass('msg-body').text(text);
  msgText.appendTo(msgContainer);
  const yesButton = $('<div></div>').addClass('button yes').text('Yes');
  const noButton = $('<div></div>').addClass('button no').text('No');
  yesButton.on('click', () => {
    msgContainer.remove();
    callback(true);
  });
  noButton.on('click', () => {
    msgContainer.remove();
    callback(false);
  });
  yesButton.appendTo(msgContainer);
  noButton.appendTo(msgContainer);

  msgContainer.appendTo(body);
}

function hidePlanetInfo(planet) {
  console.assert(planet);
  if (planet.hasComlink && planet.comlinkOn) {
    return;
  }
  planet2DOM[planet.name].dom1.find('.button.comlink-enable').hide();
  planet2DOM[planet.name].dom2.hide();
  planet2DOM[planet.name].dom3.hide();
}

function showPlanetInfo(planet) {
  console.assert(planet);
  if (!planet.hasComlink) {
    planet2DOM[planet.name].dom1.find('.button.comlink-enable').show();
  }
  planet2DOM[planet.name].dom2.show();
  planet2DOM[planet.name].dom3.show();
}

function generatePlanetInfoPanels() {
  planets.forEach(p=>{
    // generate planet name area with buttons
    const nameContainer = $('<div></div>').addClass('name-container');
    nameContainer.appendTo(container);
    nameContainer.css({
      // TODO: actually center, based on name length / actual width
      top: p.y - 90 + 'px',
      left: p.x - 100 + 'px'
    });

    const button = $('<div></div>').addClass(['button', 'go']);
    const img = $('<img src="assets/icons/travel.png"></img>');
    img.appendTo(button);

    button.data('planet', p);
    button.appendTo(nameContainer);
    button.on('click', () => {
      player.ships[activeShipIndex].target = p;
      updateShipList();
    });

    const nameLabel = $('<div></div>').addClass(['label', 'name']);
    nameLabel.text(p.name);
    nameLabel.appendTo(nameContainer);

    const button2 = $('<div></div>').addClass(['button', 'comlink-enable']);
    const img2 = $('<img src="assets/icons/add-comlink.png"></img>');
    img2.appendTo(button2);
    button2.on('click', () => {
      showMessage(
        `Would you like to pay $500 to set up a com-link at ${p.name}?`,
        function(approved) {
          if (approved) {
            button2.hide();
            button3.show();
            player.score -= 500;
            updateScore();
            p.hasComlink = true;
            updateOrbitInfo();
          }
        }
      );
    });
    button2.hide();
    button2.appendTo(nameContainer);

    const button3 = $('<div></div>').addClass(['button', 'comlink-toggle']);
    const img3 = $('<img src="assets/icons/comlink.png"></img>');
    button3.on('click', () => {
      p.comlinkOn = !(p.comlinkOn);
      console.log('comlink toggled to:', p.comlinkOn);
      button3.removeClass(['comlink-on', 'comlink-off']);
      button3.addClass(p.comlinkOn? 'comlink-on' : 'comlink-off');
      updateOrbitInfo();
    });
    button3.hide();
    img3.appendTo(button3);
    button3.appendTo(nameContainer);

    // generate inventory
    const planetInventory = $('<div></div>').addClass(['inventory', 'planet']);
    planetInventory.css({
      top: p.y - 30 + 'px',
      left: p.x - 200 + 'px'
    });

    const contractsContainer = $('<div></div>').addClass('container').appendTo(planetInventory);
    refreshPlanetContracts(contractsContainer, p);
    p.contractsContainer = contractsContainer; // save DOM reference to planet object
    contractsContainer.appendTo(planetInventory);

    const shipInventory = $('<div></div>').addClass(['inventory', 'ships']);
    shipInventory.data('planet', p);
    shipInventory.on('click', '.cell', (event)=>{
      if (!draggedItem) {
        return;
      }
      const target = $(event.target);
      const coords = target.data('coords');
      // first parent is the row, parent of that is the table
      const ship = target.parent().parent().data('ship');
      dropItemFromCursor(ship, coords);
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

    // hide optional panels by default, JS will toggle
    planetInventory.hide();
    shipInventory.hide();

    // save shortcuts
    planet2DOM[p.name].dom1 = nameContainer;
    planet2DOM[p.name].dom2 = planetInventory;
    planet2DOM[p.name].dom3 = shipInventory;
  });
}
