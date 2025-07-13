const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

document.querySelector('.go-back').addEventListener('mouseover', function () {
  const tooltip = document.createElement('span');
  tooltip.textContent = 'Go Back To Home';
  tooltip.style.position = 'absolute';
  tooltip.style.top = '50px';
  tooltip.style.left = '50px';
  tooltip.style.padding = '5px 10px';
  tooltip.style.background = 'black';
  tooltip.style.color = 'white';
  tooltip.style.borderRadius = '5px';
  tooltip.style.fontSize = '0.9rem';
  tooltip.style.zIndex = '20';
  tooltip.classList.add('tooltip');
  document.body.appendChild(tooltip);
});

document.querySelector('.go-back').addEventListener('mouseout', function () {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) tooltip.remove();
});


class ClickSpark extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.createSpark();
    this.svg = this.shadowRoot.querySelector("svg");
    document.body.addEventListener("click", this);
  }

  disconnectedCallback() {
    document.body.removeEventListener("click", this);
  }

  handleEvent(e) {
    this.setSparkPosition(e);
    this.animateSpark();
  }

  animateSpark() {
    let sparks = [...this.svg.children];
    let size = parseInt(sparks[0].getAttribute("y1"));
    let offset = size / 2 + "px";

    let keyframes = (i) => {
      let deg = `calc(${i} * (360deg / ${sparks.length}))`;

      return [
        {
          strokeDashoffset: size * 3,
          transform: `rotate(${deg}) translateY(${offset})`,
        },
        {
          strokeDashoffset: size,
          transform: `rotate(${deg}) translateY(0)`,
        },
      ];
    };

    let options = {
      duration: 660,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      fill: "forwards",
    };

    sparks.forEach((spark, i) => spark.animate(keyframes(i), options));
  }

  setSparkPosition(e) {
    this.style.left = e.pageX - this.clientWidth / 2 + "px";
    this.style.top = e.pageY - this.clientHeight / 2 + "px";
    this.style.display = "block"; // Ensure it's visible
  }

  createSpark() {
    return `
      <style>
        :host {
          position: absolute;
          z-index: 9999;
          pointer-events: none;
          display: none;
          color:yellow
        }
      </style>
      <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" stroke="var(--click-spark-color, currentcolor)" transform="rotate(-20)">
        ${Array.from(
          { length: 8 },
          (_) =>
            `<line x1="50" y1="30" x2="50" y2="4" stroke-dasharray="30" stroke-dashoffset="30" style="transform-origin: center" />`
        ).join("")}
      </svg>
    `;
  }
}

customElements.define("click-spark", ClickSpark);

// Append a global spark element to the body
const spark = document.createElement("click-spark");
document.body.appendChild(spark);


