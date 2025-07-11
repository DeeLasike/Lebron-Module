// Scene setup
let scene, camera, renderer, controls;
let lebronModel, basketball, jerseyMesh, bodyMesh;
let animationMixer, currentAction;
let isWireframe = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 4);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('container').appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 2;
    setupLighting();
    createLeBronModel();
    createBasketball();
    createFloor();
    animate();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffff88, 0.2);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);
}

function createLeBronModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.25, 1.2, 12);
    const skinMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    bodyMesh = new THREE.Mesh(bodyGeometry, skinMaterial);
    bodyMesh.position.y = 1.4;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);
    const headGeometry = new THREE.SphereGeometry(0.22, 16, 16);
    const headMesh = new THREE.Mesh(headGeometry, skinMaterial);
    headMesh.position.y = 2.3;
    headMesh.castShadow = true;
    group.add(headMesh);
    const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 2.35, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 2.35, 0.18);
    group.add(rightEye);
    // Hair - LeBron's signature look
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x2C1810 });
    const topHairGeometry = new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const topHair = new THREE.Mesh(topHairGeometry, hairMaterial);
    topHair.position.set(0, 2.42, -0.08);
    topHair.scale.set(1, 0.7, 1.2);
    group.add(topHair);
    const sideHairGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const leftSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    leftSideHair.position.set(-0.18, 2.35, -0.05);
    leftSideHair.scale.set(1, 0.8, 0.9);
    group.add(leftSideHair);
    const rightSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    rightSideHair.position.set(0.18, 2.35, -0.05);
    rightSideHair.scale.set(1, 0.8, 0.9);
    group.add(rightSideHair);
    const backHairGeometry = new THREE.SphereGeometry(0.15, 10, 8);
    const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
    backHair.position.set(0, 2.38, -0.15);
    backHair.scale.set(1.2, 0.6, 1);
    group.add(backHair);
    // Beard
    const beardMaterial = new THREE.MeshLambertMaterial({ color: 0x1A0F08 });
    const beardGeometry = new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.4);
    const beard = new THREE.Mesh(beardGeometry, beardMaterial);
    beard.position.set(0, 2.15, 0.15);
    beard.scale.set(1.1, 1, 1.2);
    group.add(beard);
    const mustacheGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.06);
    const mustache = new THREE.Mesh(mustacheGeometry, beardMaterial);
    mustache.position.set(0, 2.25, 0.19);
    group.add(mustache);
    const goateeGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.05);
    const goatee = new THREE.Mesh(goateeGeometry, beardMaterial);
    goatee.position.set(0, 2.08, 0.18);
    group.add(goatee);
    const sideBeardGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.04);
    const leftSideBeard = new THREE.Mesh(sideBeardGeometry, beardMaterial);
    leftSideBeard.position.set(-0.12, 2.18, 0.16);
    leftSideBeard.rotation.y = -0.3;
    group.add(leftSideBeard);
    const rightSideBeard = new THREE.Mesh(sideBeardGeometry, beardMaterial);
    rightSideBeard.position.set(0.12, 2.18, 0.16);
    rightSideBeard.rotation.y = 0.3;
    group.add(rightSideBeard);
    const eyebrowGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.03);
    const eyebrowMaterial = new THREE.MeshLambertMaterial({ color: 0x2C1810 });
    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-0.08, 2.42, 0.16);
    leftEyebrow.rotation.z = 0.1;
    group.add(leftEyebrow);
    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(0.08, 2.42, 0.16);
    rightEyebrow.rotation.z = -0.1;
    group.add(rightEyebrow);
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.8, 8);
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(-0.35, 1.3, 0);
    leftArm.rotation.z = Math.PI / 12;
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(0.35, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 12;
    rightArm.castShadow = true;
    group.add(rightArm);
    // Hands
    const handGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(-0.45, 0.95, 0);
    leftHand.castShadow = true;
    group.add(leftHand);
    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(0.45, 0.95, 0);
    rightHand.castShadow = true;
    group.add(rightHand);
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 1.0, 8);
    const leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
    leftLeg.position.set(-0.15, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
    rightLeg.position.set(0.15, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    // Feet/Shoes
    const shoeGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.35);
    const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.set(-0.15, -0.15, 0.1);
    leftShoe.castShadow = true;
    group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.set(0.15, -0.15, 0.1);
    rightShoe.castShadow = true;
    group.add(rightShoe);
    const swooshGeometry = new THREE.PlaneGeometry(0.06, 0.03);
    const swooshMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leftSwoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    leftSwoosh.position.set(-0.15, -0.12, 0.18);
    group.add(leftSwoosh);
    const rightSwoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    rightSwoosh.position.set(0.15, -0.12, 0.18);
    group.add(rightSwoosh);
    createJersey(group);
    lebronModel = group;
    scene.add(lebronModel);
}

function createJersey(parentGroup) {
    const jerseyGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 12);
    const jerseyMaterial = new THREE.MeshLambertMaterial({ color: 0xFDB927 });
    jerseyMesh = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
    jerseyMesh.position.y = 1.5;
    jerseyMesh.castShadow = true;
    parentGroup.add(jerseyMesh);
    const trimGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.6);
    const trimMaterial = new THREE.MeshLambertMaterial({ color: 0x552583 });
    const leftTrim = new THREE.Mesh(trimGeometry, trimMaterial);
    leftTrim.position.set(-0.38, 1.5, 0);
    parentGroup.add(leftTrim);
    const rightTrim = new THREE.Mesh(trimGeometry, trimMaterial);
    rightTrim.position.set(0.38, 1.5, 0);
    parentGroup.add(rightTrim);
    const lakersTextGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.01);
    const lakersTextMaterial = new THREE.MeshLambertMaterial({ color: 0x552583 });
    const lakersText = new THREE.Mesh(lakersTextGeometry, lakersTextMaterial);
    lakersText.position.set(0, 1.7, 0.41);
    parentGroup.add(lakersText);
    const numberGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.01);
    const numberMaterial = new THREE.MeshLambertMaterial({ color: 0x552583 });
    const number2 = new THREE.Mesh(numberGeometry, numberMaterial);
    number2.position.set(-0.08, 1.4, 0.41);
    parentGroup.add(number2);
    const number3 = new THREE.Mesh(numberGeometry, numberMaterial);
    number3.position.set(0.08, 1.4, 0.41);
    parentGroup.add(number3);
    const shortsGeometry = new THREE.CylinderGeometry(0.35, 0.3, 0.4, 12);
    const shortsMesh = new THREE.Mesh(shortsGeometry, jerseyMaterial);
    shortsMesh.position.y = 0.8;
    shortsMesh.castShadow = true;
    parentGroup.add(shortsMesh);
    const waistbandGeometry = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 12);
    const waistbandMesh = new THREE.Mesh(waistbandGeometry, trimMaterial);
    waistbandMesh.position.y = 0.98;
    parentGroup.add(waistbandMesh);
    const stripeGeometry = new THREE.BoxGeometry(0.03, 0.4, 0.3);
    const leftStripe = new THREE.Mesh(stripeGeometry, trimMaterial);
    leftStripe.position.set(-0.32, 0.8, 0);
    parentGroup.add(leftStripe);
    const rightStripe = new THREE.Mesh(stripeGeometry, trimMaterial);
    rightStripe.position.set(0.32, 0.8, 0);
    parentGroup.add(rightStripe);
    const wishLogoGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.01);
    const wishLogoMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const wishLogo = new THREE.Mesh(wishLogoGeometry, wishLogoMaterial);
    wishLogo.position.set(-0.25, 1.85, 0.41);
    parentGroup.add(wishLogo);
    const nbaLogoGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.01);
    const nbaLogoMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const nbaLogo = new THREE.Mesh(nbaLogoGeometry, nbaLogoMaterial);
    nbaLogo.position.set(0.25, 1.85, 0.41);
    parentGroup.add(nbaLogo);
    const armBandGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8);
    const armBandMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leftArmBand = new THREE.Mesh(armBandGeometry, armBandMaterial);
    leftArmBand.position.set(-0.45, 1.8, 0);
    leftArmBand.rotation.z = Math.PI / 6;
    parentGroup.add(leftArmBand);
    const rightArmBand = new THREE.Mesh(armBandGeometry, armBandMaterial);
    rightArmBand.position.set(0.45, 1.8, 0);
    rightArmBand.rotation.z = -Math.PI / 6;
    parentGroup.add(rightArmBand);
}

function createBasketball() {
    const ballGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    basketball = new THREE.Mesh(ballGeometry, ballMaterial);
    basketball.position.set(-0.6, 0.95, 0.2);
    basketball.castShadow = true;
    const lineGeometry = new THREE.TorusGeometry(0.12, 0.005, 4, 20);
    const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.position.copy(basketball.position);
    line1.rotation.x = Math.PI / 2;
    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.position.copy(basketball.position);
    line2.rotation.z = Math.PI / 2;
    scene.add(basketball);
    scene.add(line1);
    scene.add(line2);
    const textGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.001);
    const textMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const spaldingText = new THREE.Mesh(textGeometry, textMaterial);
    spaldingText.position.set(-0.6, 1.07, 0.2);
    scene.add(spaldingText);
}

function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8B4513,
        transparent: true,
        opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);
    const lineGeometry = new THREE.BoxGeometry(0.1, 0.01, 10);
    const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.position.set(0, -0.19, 0);
    centerLine.rotation.z = Math.PI / 2;
    scene.add(centerLine);
}

function animateShoot() {
    if (!lebronModel) return;
    const tl = new TimelineMax();
    tl.to(lebronModel.rotation, 0.5, { y: Math.PI * 0.1 })
      .to(lebronModel.children[4].rotation, 0.3, { z: -Math.PI * 0.3 }, 0)
      .to(basketball.position, 0.8, { 
          x: 2, 
          y: 4, 
          z: -3,
          ease: "power2.out"
      }, 0.2)
      .to(basketball.rotation, 0.8, { 
          x: Math.PI * 2, 
          y: Math.PI * 2 
      }, 0.2);
}

function animateDribble() {
    if (!basketball) return;
    const tl = new TimelineMax({ repeat: 3 });
    tl.to(basketball.position, 0.3, { y: 0.5 })
      .to(basketball.position, 0.3, { y: 0.95 })
      .to(basketball.rotation, 0.6, { x: Math.PI * 2 }, 0);
}

function resetPose() {
    if (!lebronModel || !basketball) return;
    lebronModel.rotation.set(0, 0, 0);
    basketball.position.set(-0.6, 0.95, 0.2);
    basketball.rotation.set(0, 0, 0);
    lebronModel.children.forEach((child, index) => {
        if (index === 19) {
            child.rotation.z = Math.PI / 12;
        } else if (index === 20) {
            child.rotation.z = -Math.PI / 12;
        }
    });
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.wireframe = isWireframe;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (lebronModel) {
        lebronModel.position.y = 0.05 * Math.sin(Date.now() * 0.001) + 0;
        lebronModel.children[0].scale.y = 1 + 0.02 * Math.sin(Date.now() * 0.002);
    }
    if (basketball) {
        basketball.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('load', init);

// Add GSAP for smooth animations (CDN)
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
document.head.appendChild(script);
script.onload = function() {
    const tlScript = document.createElement('script');
    tlScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TimelineMax.min.js';
    document.head.appendChild(tlScript);
};
