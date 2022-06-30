'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const selectionRunning = document.querySelector('option[value="running"]');

class Workout {
  // clicks = 0;
  constructor(coords, duration, distance) {
    this.date = new Date();
    this.id = (Date.now() + '').slice(-10);
    this.coords = coords;
    this.duration = duration; //km
    this.distance = distance; //min
  }
  _getTitle() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.title = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.calcPace();
    this._getTitle();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._getTitle();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
    return this.speed;
  }
}

const work1 = new Running([11, 23], 5, 12, 3);
console.log(work1);
//////////////////////////////////////////////////////////////////
////APPLICATION

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._showClickedWorkout.bind(this)
    );
  }
  _getPosition() {
    //when we use getCurrnetPosition, it will automatically pass position argument into it's first callback function
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Cannot get current location');
      }
    );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const location = [latitude, longitude];
    this.#map = L.map('map').setView(location, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    if (!this.#workouts) return;
    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  //this function is this.#map.on()'s eventHandler, so it will recieve event argument from eventListener
  _showForm(mapE) {
    form.classList.toggle('hidden');
    inputDistance.focus();
    this.#mapEvent = mapE;
  }

  _initForm() {
    //Clear input field
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    selectionRunning.selected = true;
    inputDistance.focus();
    inputElevation.closest('.form__row').classList.add('form__row--hidden');
    inputCadence.closest('.form__row').classList.remove('form__row--hidden');

    //Hide form and in order to skip the animation during hiding, set form's display "none" and 1 sec later set it ///back to grid when the animation ended.
    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInput = function (...inputs) {
      return inputs.every(input => Number.isFinite(input));
    };

    const isPositive = function (...values) {
      return values.every(value => value > 0);
    };

    const type = inputType.value;
    //+ makes the input value as Number
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //Create object depends on workout's type
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInput(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('Please input positive number');
      workout = new Running([lat, lng], duration, distance, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert('Please input positive number');
      workout = new Cycling([lat, lng], duration, distance, elevation);
    }

    this.#workouts.push(workout);
    console.log(this.#workouts);

    //Add marker
    this._renderWorkoutMarker(workout);

    //Add on list
    this._renderWorkoutList(workout);

    //Add to localStorage
    this._setLocalStorage();

    //Set form back to initial state
    this._initForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.title}`
      )
      .openPopup();
  }

  _renderWorkoutList(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.title}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
            </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${workout.speed}</span>
                  <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⛰</span>
                  <span class="workout__value">${workout.elevation}</span>
                  <span class="workout__unit">m</span>
                </div>
              </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _showClickedWorkout(e) {
    if (!e.target.closest('.workout')) return;
    const workoutId = e.target.closest('.workout').dataset.id;
    const workout = this.#workouts.find(workout => workout.id === workoutId);

    this.#map.setView(workout.coords, 14, {
      zoom: { animate: true },
      pan: { duration: 1 },
    });

    workout._click();
    console.log(this.#workouts);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));
    if (!workouts) return;

    console.log(workouts);

    // When we rectrive data from localStorage, data will lose their prototype, so we add it back.
    const protoWorkouts = workouts.map(workout => {
      if (workout.type === 'running') workout.__proto__ = Running.prototype;
      if (workout.type === 'cycling') workout.__proto__ = Cycling.prototype;
      return workout;
    });
    this.#workouts = protoWorkouts;

    this.#workouts.forEach(workout => {
      this._renderWorkoutList(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
