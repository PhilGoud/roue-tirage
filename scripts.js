const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const namesInput = document.getElementById("namesInput");
const drawButton = document.getElementById("drawButton");
const winnerModal = document.getElementById("winnerModal");
const winnerNameSpan = document.getElementById("winnerName");

let names = [];
let spinning = false;
let lastRotationAngle = 0; // Angle final de la roue après le tirage

// Correction manuelle de l'alignement du gagnant (en degrés)
let correctionOffset = 270; // Ajustez cette valeur pour décaler le gagnant


// Dimensions du canvas
canvas.width = 500;
canvas.height = 500;
const canvasRadius = canvas.width / 2;

// Couleurs de Noël
const christmasColors = [
    "#FF0000", // Rouge vif
    "#00A550", // Vert sapin
    "#FFD700", // Or
    "#8B0000", // Rouge foncé
    "#006400", // Vert foncé
    "#4B0082", // Indigo
    "#8B4513", // Brun terre
    "#2F4F4F", // Gris foncé
    "#1C1C1C", // Noir presque pur
    "#800080", // Violet foncé
    "#556B2F", // Vert olive foncé
  ];

// Dessiner la roue
function drawWheel(names, rotationAngle = 0, winningAngle = null) {
  const numSegments = names.length || 1;
  const segmentAngle = (2 * Math.PI) / numSegments;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Appliquer la rotation
  ctx.rotate(rotationAngle);

  for (let i = 0; i < numSegments; i++) {
    // Dessiner les segments
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, canvasRadius, i * segmentAngle, (i + 1) * segmentAngle);
    ctx.fillStyle = christmasColors[i % christmasColors.length];
    ctx.fill();

    // Ajouter les textes dans le sens du rayon
    ctx.save();
    const angle = i * segmentAngle + segmentAngle / 2;
    ctx.rotate(angle); // Tourner pour aligner le texte avec le segment
    ctx.translate(canvasRadius / 2, 0); // Positionner le texte radialement
    ctx.rotate(Math.PI); // Faire face au centre
    ctx.fillStyle = "#FFF";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(names[i] || "", 0, 0);
    ctx.restore();
  }

  // Si un angle de détection est donné, dessiner un gros point
  if (winningAngle !== null) {
    ctx.save();
    ctx.fillStyle = "transparent"; // Couleur du gros point
    ctx.beginPath();
    const x = Math.cos(winningAngle) * canvasRadius * 0.8;
    const y = Math.sin(winningAngle) * canvasRadius * 0.8;
    ctx.arc(x, y, 10, 0, 2 * Math.PI); // Positionner le gros point à l'angle de détection
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// Animation et tirage au sort
function spinWheel() {
  if (spinning || names.length === 0) return;

  spinning = true;

  const duration = 10; // Durée totale en secondes
  const startTime = Date.now();
  const initialSpeed = 8 ; // Vitesse initiale en tours par seconde
  const finalSpeed = 1 / 5000; // Vitesse finale en tours par seconde

  let rotationAngle = lastRotationAngle; // Commence avec l'angle actuel

  function animate() {
    const elapsedTime = (Date.now() - startTime) / 1000; // Temps écoulé en secondes
    const progress = elapsedTime / duration;

    if (progress >= 1) {
      spinning = false;

      // Normaliser l'angle entre 0 et 2π (un tour complet)
      rotationAngle %= 2 * Math.PI;
      lastRotationAngle = rotationAngle; // Stocker l'angle final
      const segmentAngle = (2 * Math.PI) / names.length;
      const correctionOffsetRadians = (correctionOffset * Math.PI) / 180; // Convertir l'offset en radians

      // Calculer l'angle du gagnant avec l'offset
      const winningAngle =
        (2 * Math.PI - rotationAngle + correctionOffsetRadians) % (2 * Math.PI);
      const winningIndex = Math.floor(winningAngle / segmentAngle) % names.length;

      // Afficher le gagnant et le point de détection
      drawWheel(names, rotationAngle, winningAngle);
      announceWinner(names[winningIndex]);
      return;
    }

    // Calculer la vitesse selon la progression
    const easedProgress = easeOutQuad(progress);
    const currentSpeed =
      initialSpeed - (initialSpeed - finalSpeed) * easedProgress;

    // Calculer l'angle de rotation
    rotationAngle += currentSpeed * 2 * Math.PI * (1 / 60); // Vitesse * (frame time)
    drawWheel(names, rotationAngle); // Afficher sans le point de détection pendant l'animation
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function attendre(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function announceWinner(winner) {
    winnerNameSpan.textContent = winner;
  
    // Effets de confettis
    const confettiDuration = 2000;
    const confettiEnd = Date.now() + confettiDuration;
  
    (function frame() {
      confetti({
        particleCount: 50,
        angle: Math.random() * 60 + 120,
        spread: 55,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
      if (Date.now() < confettiEnd) {
        requestAnimationFrame(frame);
      }
    })();
  
    // Attendre 1/2 seconde
    await attendre(500);
  
    winnerModal.classList.remove("hidden");
  }
  

// Fonction easing pour ralentir progressivement
function easeOutQuad(t) {
  return t * (2 - t); // Fonction easing pour une décélération progressive
}

// Met à jour les noms et redessine la roue
namesInput.addEventListener("input", () => {
  names = namesInput.value.split("\n").filter((name) => name.trim() !== "");
  localStorage.setItem("names", JSON.stringify(names)); // Sauvegarder dans le localStorage
  drawWheel(names, lastRotationAngle); // Conserver l'angle actuel
});

// Lancer le tirage
drawButton.addEventListener("click", spinWheel);

// Fermer la modale
winnerModal.addEventListener("click", () => {
    winnerModal.classList.add("hidden");
    drawWheel(names, lastRotationAngle); // Conserver l'état final de la roue
  });
  
  // Initialisation au chargement de la page
  window.addEventListener("load", () => {
    // Vérifier si des noms sont stockés dans le localStorage
    const savedNames = localStorage.getItem("names");
    if (savedNames) {
      names = JSON.parse(savedNames); // Convertir en tableau
      namesInput.value = names.join("\n"); // Récupérer la valeur dans le champ de saisie
      drawWheel(names, lastRotationAngle); // Dessiner la roue avec les noms chargés
    } else {
      drawWheel(names, lastRotationAngle); // Si aucun nom n'est sauvegardé, dessiner une roue vide
    }
  });
  
