const LOG_STATE = false;

// Utilities
const delay = (n) =>
  new Promise(function(resolve){ setTimeout(resolve, n*1000); });

const inRange = (value, lower, upper) =>
  value >= Math.min(lower, upper) && value < Math.max(lower, upper);

const objectsAreEqual = function (var1, var2) {
  if (typeof var1 === 'object' && typeof var2 === 'object') {
      // Checking equality for each of the inner values of the objects
      const keys = [...new Set([...Object.keys(var1),...Object.keys(var2)])];
      return keys.every(key => objectsAreEqual(var1[key], var2[key]) && objectsAreEqual(var2[key], var1[key]));
  } else { // Primitive types (number, boolean etc..)
      return var1 === var2; // Normal equality
  }
}

const randInt = (upper) => {
  const randomInteger = Math.round(Math.random() * (upper));
  if (LOG_STATE) console.log('Generated INT:', randomInteger);
  return randomInteger;
}

const getNextCoord = (snek, direction) => {
  const result = {
    'row': snek.head.row + MOVE_SET[direction].row,
    'col': snek.head.col + MOVE_SET[direction].col,
  }

  return result;
}

const MOVE_SET  = {
  'UP': {
    'row': -1,
    'col': 0
  },
  'DOWN': {
    'row': 1,
    'col': 0
  },
  'LEFT': {
    'row': 0,
    'col': -1
  },
  'RIGHT': {
    'row': 0,
    'col': 1
  },
  'NONE': {
    'row': 0,
    'col': 0
  },
}

class DifficultySetting {
  constructor (baseSpeed, adjustValue, speedOffset){
    this.baseSpeed = baseSpeed;
    this.adjustValue = adjustValue;
    this.speedOffset = speedOffset;
  }
}

const DIFFICULTIES = {
  'EASY': new DifficultySetting(
    baseSpeed= 1,
    adjustValue= 5,
    speedOffset= 0.005,
  ),
  'NORMAL': new DifficultySetting(
    baseSpeed= 0.6,
    adjustValue= 3,
    speedOffset= 0.0085,
  ),
  'HARD': new DifficultySetting(
    baseSpeed= 0.25,
    adjustValue= 2,
    speedOffset= 0.02,
  ),
}

// Game defaults
let dim = [8,8];
let highScore = 0;
const startingLength = 4;

class Coordinate{
  constructor(row, col){
    this.row = row;
    this.col = col;
  }
}

class GameGrid {
  constructor (dimensions){
    this.width = dimensions[0];
    this.height = dimensions[1];
    this.startMatrix();
    this.food = null;
  }

  removeFood() { this.food = null; }

  startMatrix(){
    this.matrix = []
    for (let i = 0; i < this.width; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < this.height; j++)
        this.matrix[i][j] = '';
    }
  }

  clearMatrix(){
    for (let i = 0; i < this.width; i++)
      for (let j = 0; j < this.height; j++)
        this.matrix[i][j] = '';
  }

  setSnek(snek){
    this.snek = snek;
    this.clearMatrix();

    if (this.food == null)
      this.generateFood();
    
    this.matrix[this.food.row][this.food.col] = 'food';

    snek.body.map(
      (coordPair) => {
        this.matrix[coordPair.row][coordPair.col] = 'snek';
      }
    );

    if (LOG_STATE) console.log('matrix:', this.matrix);
  }

  generateFood(){
    let generatedCoord;
    do {
      if (LOG_STATE) console.log('Cooking...');
      let row = randInt(this.height - 1);
      let col = randInt(this.width - 1);
      generatedCoord = {
        'row': row,
        'col': col
      };
    } while (
      this.snek.isInBody(generatedCoord)
    );

    const foodCoords = generatedCoord;

    this.matrix[generatedCoord.row][generatedCoord.col] = 'food';
    this.food = foodCoords;

    if (LOG_STATE) console.log('Placed food at:', this.food);

    return foodCoords;
  }

  hasCoord(coord){
    return (inRange(coord.row, 0, this.width)) && (inRange(coord.col, 0, this.height));
  }
}

class Snek{
  constructor(){
    // Coordinate stack
    this.body = [];
    this.initialLength = 4;
    this.generate({'row': 0, 'col': 0}, this.initialLength);

    if (LOG_STATE) console.log('created snek', this);
  }

  isInBody(coord){
    let result = false;
    if (objectsAreEqual(this.tail, coord)){
      if (LOG_STATE) console.log('My tail is equal to this coordinate:', coord, this.body);
      result = true;
    }
    else this.body.forEach(
      (coordinateInBody) => {
        if (objectsAreEqual(coord, coordinateInBody)) {
          if (LOG_STATE) console.log('My body has this coordinate:', coord, this.body);
          result = true;
        }
      }
    );
    return result;
  }

  generate(startingPos, startingLength){
    this.body.push(startingPos);
    const newCoord = {
      'row': startingPos.row,
      'col': startingPos.col
    }

    // Generates rest of body downwards
    for (let i = 1; i < startingLength; i++){
      const temp = {
        'row': newCoord.row + i,
        'col': newCoord.col
      };
      this.body.push(temp);
    }

    this.head = this.body[this.body.length - 1];
    this.tail = this.body[0];
  }

  eat(){
    const tempBody = [];
    tempBody.push(this.tail);
    
    this.body.map(
      (coordPair) => {
        if (LOG_STATE) console.log('pushing to temp body:', coordPair);
        tempBody.push(coordPair);
      }
    );
    
    this.body = tempBody;

    if (LOG_STATE) console.log('yummy tail', this);
  }

  move(row= 0, col= 0){
    const newHead = {
      'row': this.head.row + row,
      'col': this.head.col + col,
    };
    this.body.push(newHead);
    this.head = newHead;
    //Remove oldest entry in b stack
    this.tail = this.body.splice(0, 1)[0];
    if (LOG_STATE) console.log('moved', this);
  }

  isEatingItself(){
    if (this.body.length < 2)
      return false;

    for (let i = 0; i < this.body.length; i++)
      for (let j = 0; j < this.body.length; j++){
        // Skip current entry
        if (i === j) continue;

        if (objectsAreEqual(this.body[i], this.body[j]))
          return true;
      }
    
    return false;
  }
}

class GameSession{
  constructor(grid= new GameGrid(dim), snek= new Snek(), difficulty= DIFFICULTIES['NORMAL']){
    this.grid = grid;
    this.snek = snek;
    this.stop = false;
    this.currentDirection = 'DOWN';

    this.difficulty = difficulty;
    this.updateSpeed = this.difficulty.baseSpeed;
    this.latestAdjustedScore = 0;

    this.running = true;
    this.directionIsLocked = false;

    this.scoreContainer = document.getElementById('score');
    this.parentContainer = document.getElementById('main');
    this.highScoreContainer = document.getElementById('high-score');
  }

  setDirection(direction){
    if (this.currentDirection === direction || this.directionIsLocked) return;

    const rowResult = MOVE_SET[direction].row + MOVE_SET[this.currentDirection].row;
    const colResult = MOVE_SET[direction].col + MOVE_SET[this.currentDirection].col;

    if (rowResult === 0 && colResult === 0) return;

    this.currentDirection = direction;
    this.directionIsLocked = true;
  }

  toggleStop() {
    this.stop = !this.stop;
    if (!this.stop)
      this.thread()
  }

  update(){
    this.directionIsLocked = false;
    this.grid.setSnek(this.snek);
    drawGrid(this.grid, this.parentContainer);

    const currentScore = this.snek.body.length - this.snek.initialLength;
    this.scoreContainer.innerHTML = currentScore;

    if (highScore < currentScore) highScore = currentScore;
    this.highScoreContainer.innerHTML = highScore;

    this.adjustDifficulty(currentScore);
  }

  adjustDifficulty(score){
    const HARD_LIMIT = 0.065;

    // Handle updates w/same score
    if (this.latestAdjustedScore === score)
      return;
    else if (
        score % this.difficulty.adjustValue === 0 &&
        this.updateSpeed > HARD_LIMIT
      ){
        this.updateSpeed = (this.updateSpeed - (this.difficulty.speedOffset * (score / this.difficulty.adjustValue).toFixed(3)).toFixed(3)).toFixed(3);

        this.latestAdjustedScore = score;
        if (LOG_STATE) console.log('Difficulty adjusted:', this.updateSpeed);
      }
  }

  async thread(){
    const handleWin = () => {
      this.stop = true;
      this.running = false;
      alert('u win :D');
    };

    const handleLose = () => {
      this.stop = true;
      this.running = false;
      alert('u lose');
    }

    const snekInGrid = () => {
      let result = true;
      this.snek.body.forEach(
        (coordPair) => {
          const tempCoords = {
            'row': coordPair.row,
            'col': coordPair.col
          };
          if (!this.grid.hasCoord(tempCoords)) result = false;
        }
      );
      return result;
    }

    try {
      while (!this.stop){
        if (LOG_STATE) console.log('Updated thread');

        if (Object.values(this.snek.body).length >= this.grid.width * this.grid.height){
          handleWin();
          break;
        }

        const movement = MOVE_SET[this.currentDirection];
        this.snek.move(movement.row, movement.col);

        if (!snekInGrid() || this.snek.isEatingItself()){
          if (LOG_STATE) console.log(this.snek);
          handleLose();
          break;
        }

        const headCoords = this.snek.head;
        // const nextCoord = getNextCoord(this.snek, this.currentDirection);
  
        if (this.grid.matrix[headCoords.row][headCoords.col] == 'food') {
          this.snek.eat();
          this.grid.removeFood();
        }

        this.update();
        await delay(this.updateSpeed);
      }
    } catch(e) {
      this.stop = true;
      console.error('Snek Stopped:', e);
    }
  }
}

// Start grid
const drawGrid = (grid, parent) => {
  Array.from(parent.children).map(
    (child) => child.remove()
  );

  for (let j = 0; j < grid.height; j++)
  {
    const row = document.createElement('section');
    for (let i = 0; i < grid.width; i++)
    {
      const square = document.createElement('div');
      square.setAttribute('id', `coord-${i}-${j}`);

      switch (grid.matrix[i][j]){
        case 'snek':
          square.setAttribute('class', 'snek-body');
          break;
        case 'food':
          square.setAttribute('class', 'food');
          break;
      }
      row.appendChild(square);
    }
    parent.appendChild(row);
  }
}

let session;

const resetSession = () => session = new GameSession();
const togglePlay = () => session.toggleStop();
const moveSnek = (direction) => session.setDirection(direction);

// Swipe controls
let touchStartX, touchEndX,
  touchStartY, touchEndY;

const determineSwipeDirection = () => {
  let result = 'NONE';
  const lenX = Math.pow(touchEndX - touchStartX, 2);
  const lenY = Math.pow(touchEndY - touchStartY, 2);

  if (lenX < 50 && lenY < 50) return result;

  if (lenX > lenY)
    (touchEndX - touchStartX < 0) ? result ='LEFT' : result = 'RIGHT';

  else (touchEndY - touchStartY < 0) ? result ='UP' : result = 'DOWN';
  return result;
};

document.addEventListener('touchstart', e => {
  touchStartX = Math.round(e.changedTouches[0].screenX);
  touchStartY = Math.round(e.changedTouches[0].screenY);
});

document.addEventListener('touchend', e => {
  touchEndX = Math.round(e.changedTouches[0].screenX);
  touchEndY = Math.round(e.changedTouches[0].screenY);

  const result = determineSwipeDirection();
  
  // Log to screen on mobile
  if (LOG_STATE) document.getElementById('debug').innerHTML = `${touchEndX - touchStartX} ||${touchEndY - touchStartY} => ${result}`;

  if (result !== 'NONE') moveSnek(result);
});

// Key bindings
document.addEventListener('keyup', (e) => {
  switch (e.code){
    case 'KeyW':
    case 'ArrowUp':
      moveSnek('UP');
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveSnek('DOWN');
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveSnek('LEFT');
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveSnek('RIGHT');
      break;
    case 'Enter':
    case 'Escape':
      if (session == undefined || !session.running) runGame();
      else togglePlay()
      break;
    default:
      console.log('Key code:', e.code);
      break;
  }
});

const runGame = async () => {
  resetSession();
  session.thread();
}