// Copyright (c) 2025 Ahsan Latif (@GittyCandy)  
// All Rights Reserved.  
//  
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//  
// Violators may be subject to legal action.  

'use strict';

const particleCount = 720;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const rangeY = 110;
const baseTTL = 60;
const rangeTTL = 200;
const baseSpeed = 0.2;
const rangeSpeed = 1.7;
const baseRadius = 1.8;
const rangeRadius = 3.6;
const baseHue = 220;
const rangeHue = 110;
const noiseSteps = 4;
const xOff = 0.00125;
const yOff = 0.00125;
const zOff = 0.0005;
//const backgroundColor = 'hsla(0, 0%, 100%, 1)';  // White background, change as needed
const backgroundColor = '#16001c'; // Dark purple background
let container;
let canvas;
let ctx;
let center;
let gradient;
let tick;
let simplex;
let particleProps;
let positions;
let velocities;
let lifeSpans;
let speeds;
let sizes;
let hues;

function setup() {
	createCanvas();
  resize();
  initParticles();
	draw();
}

function initParticles() {
  tick = 10;
  simplex = new SimplexNoise();
  particleProps = new Float32Array(particlePropsLength);

  let i;

  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    initParticle(i);
  }
}

function initParticle(i) {
  let x, y, vx, vy, life, ttl, speed, radius, hue;

  x = rand(canvas.a.width);
  y = center[1] + randRange(rangeY);
  vx = 0;
  vy = 0;
  life = 0;
  ttl = baseTTL + rand(rangeTTL);
  speed = baseSpeed + rand(rangeSpeed);
  radius = baseRadius + rand(rangeRadius);

  // Add white particles with 20% probability
  hue = Math.random() < 0.2 ? 0 : baseHue + rand(rangeHue); // 0 hue for white particles

  particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
}


function drawParticles() {
  let i;

  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    updateParticle(i);
  }
}

function updateParticle(i) {
  let i2=1+i, i3=2+i, i4=3+i, i5=4+i, i6=5+i, i7=6+i, i8=7+i, i9=8+i;
  let n, x, y, vx, vy, life, ttl, speed, x2, y2, radius, hue;

  x = particleProps[i];
  y = particleProps[i2];
  n = simplex.noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
  vx = lerp(particleProps[i3], cos(n), 0.6);
  vy = lerp(particleProps[i4], sin(n), 0.6);
  life = particleProps[i5];
  ttl = particleProps[i6];
  speed = particleProps[i7];
  x2 = x + vx * speed;
  y2 = y + vy * speed;
  radius = particleProps[i8];
  hue = particleProps[i9];

  drawParticle(x, y, x2, y2, life, ttl, radius, hue);

  life++;

  particleProps[i] = x2;
  particleProps[i2] = y2;
  particleProps[i3] = vx;
  particleProps[i4] = vy;
  particleProps[i5] = life;

  (checkBounds(x, y) || life > ttl) && initParticle(i);
}

function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
  ctx.a.save();
  ctx.a.lineCap = 'round';
  ctx.a.lineWidth = radius;

  // Adjust strokeStyle to make particles white if hue is 0
  const isWhite = hue === 0;
  const color = isWhite
    ? `hsla(0, 0%, 100%, ${Math.min(fadeInOut(life, ttl), 1)})` // White particles
    : `hsla(${hue}, 100%, 55%, ${Math.min(fadeInOut(life, ttl), 1)})`;

  ctx.a.strokeStyle = color;

  ctx.a.beginPath();
  ctx.a.moveTo(x, y);
  ctx.a.lineTo(x2, y2);
  ctx.a.stroke();
  ctx.a.closePath();
  ctx.a.restore();
}

function checkBounds(x, y) {
	return(
		x > canvas.a.width ||
		x < 0 ||
		y > canvas.a.height ||
		y < 0
	);
}

function createCanvas() {
  container = document.querySelector('.content--canvas');
	canvas = {
		a: document.createElement('canvas'),
		b: document.createElement('canvas')
	};
	canvas.b.style = `
      position: absolute;
      top: 0;
      left: 0;
      width: auto;
      height: auto;
	`;
	container.appendChild(canvas.b);
	ctx = {
		a: canvas.a.getContext('2d'),
		b: canvas.b.getContext('2d')
  };
  center = [];
}

function resize() {
	const { innerWidth, innerHeight } = window;

	canvas.a.width = innerWidth;
  canvas.a.height = innerHeight;

  ctx.a.drawImage(canvas.b, 0, 0);

	canvas.b.width = innerWidth;
  canvas.b.height = innerHeight;

  ctx.b.drawImage(canvas.a, 0, 0);

  center[0] = 0.5 * canvas.a.width;
  center[1] = 0.5 * canvas.a.height;
}

function renderGlow() {
  ctx.b.save();
  ctx.b.filter = 'blur(8px) brightness(350%)';  // Increase blur and brightness
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();

  ctx.b.save();
  ctx.b.filter = 'blur(4px) brightness(350%)';  // Adjust second blur
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}


function renderToScreen() {
  ctx.b.save();
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function draw() {
  tick++;

  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);

  ctx.b.fillStyle = backgroundColor;
  ctx.b.fillRect(0, 0, canvas.a.width, canvas.a.height);

  drawParticles();
  renderGlow();
  renderToScreen();

	window.requestAnimationFrame(draw);
}

window.addEventListener('load', setup);
window.addEventListener('resize', resize);

document.body.addEventListener("pointermove", ({ x, y }) => {
  document.documentElement.style.setProperty("--x", x.toFixed(2));
  document.documentElement.style.setProperty(
    "--xp",
    (x / window.innerWidth).toFixed(2)
  );
  document.documentElement.style.setProperty("--y", y.toFixed(2));
  document.documentElement.style.setProperty(
    "--yp",
    (y / window.innerHeight).toFixed(2)
  );

  console.log('x',x)
  console.log('xp', (x / window.innerWidth).toFixed(2))
  console.log(window.innerWidth)
});
jQuery(document).ready(function($) {
        		"use strict";
        		//  TESTIMONIALS CAROUSEL HOOK
		        $('#customers-testimonials').owlCarousel({
		            loop: true,
		            center: true,
		            items: 3,
		            margin: 0,
		            autoplay: true,
		            dots:true,
		            autoplayTimeout: 8500,
		            smartSpeed: 450,
		            responsive: {
		              0: {
		                items: 1
		              },
		              768: {
		                items: 2
		              },
		              1170: {
		                items: 3
		              }
		            }
		        });
        	});