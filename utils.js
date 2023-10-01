/* Shared constants, utils, globals and state vars. We are jamming! */

WIDTH = 1920;
HEIGHT = 1080;
BASE_SPEED = 6;
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

let body, container, ctx, debugLog, scoreCounter;

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

function updateScore() {
  scoreCounter.text('$'+player.score);
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
  const i0 = coords.i;
  const j0 = coords.j;
  console.log('dropping item:', draggedItem);

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
    // TODO: play error sound
    // TODO: display error message somewhere
    console.log('NO FIT - TODO: play error sound');
  } else {
    // if we fit, we add the item and recalculate the cargo layout
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
      console.log('picking up:', p.contracts[0]);
      attachItemToCursor(p, p.contracts[0]);
    });

    const shipInventory = $('<div></div>').addClass(['inventory', 'ships']);
    shipInventory.data('planet', p);
    shipInventory.on('click', '.cell', (event)=>{
      const target = $(event.target);
      const coords = target.data('coords');
      // first parent is the row, parent of that is the table
      const ship = target.parent().parent().data('ship');
      console.log('coords:', coords, 'on ship:', ship);
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
    // TODO: hide by default
  });
}
