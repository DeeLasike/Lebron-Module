// Scene setup
let scene, camera, renderer, controls;
let lebronModel, basketball, jerseyMesh, bodyMesh;
let animationMixer, currentAction;
let isWireframe = false;

function createSkinMaterial() {
    // Subtle gradient using vertex colors
    const material = new THREE.MeshLambertMaterial({
        color: 0x8B5C2B,
        vertexColors: true
    });
    return material;
}

function createGradientGeometry(geometry, topColor, bottomColor) {
    const position = geometry.attributes.position;
    const color = [];
    for (let i = 0; i < position.count; i++) {
        const y = position.getY(i);
        const t = (y - geometry.boundingBox.min.y) / (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
        const c = new THREE.Color().lerpColors(bottomColor, topColor, t);
        color.push(c.r, c.g, c.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
}

function createFaceFeatures(group, skinMaterial) {
    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.035, 0.12, 16);
    const nose = new THREE.Mesh(noseGeometry, skinMaterial);
    nose.position.set(0, 2.23, 0.23);
    nose.rotation.x = Math.PI / 2.1;
    group.add(nose);
    // Mouth
    const mouthGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16, 1, true, 0, Math.PI);
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0x6B3A1B });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 2.13, 0.22);
    mouth.rotation.z = Math.PI;
    group.add(mouth);
    // Jawline (slightly wider at the bottom)
    const jawGeometry = new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const jaw = new THREE.Mesh(jawGeometry, skinMaterial);
    jaw.position.set(0, 2.13, 0.13);
    jaw.scale.set(1.1, 0.7, 1.1);
    group.add(jaw);
}

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
    // Body (wider chest, narrower waist, more V-taper)
    const bodyGeometry = new THREE.CylinderGeometry(0.38, 0.23, 1.22, 40, 1, false); // broader chest, narrower waist
    bodyGeometry.computeBoundingBox();
    const skinMaterial = createSkinMaterial();
    createGradientGeometry(bodyGeometry, new THREE.Color(0x9C6B3B), new THREE.Color(0x6B3A1B));
    bodyMesh = new THREE.Mesh(bodyGeometry, skinMaterial);
    bodyMesh.position.y = 1.4;
    bodyMesh.castShadow = true;
    // Add pectoral definition (slight bulge)
    const pecGeometry = new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI);
    const pecs = new THREE.Mesh(pecGeometry, skinMaterial);
    pecs.position.set(0, 1.95, 0.18);
    pecs.scale.set(1.2, 0.5, 0.5);
    group.add(bodyMesh);
    group.add(pecs);
    // Add abs (slight bulges)
    for (let i = 0; i < 3; i++) {
        const ab = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), skinMaterial);
        ab.position.set(0, 1.5 - i * 0.13, 0.19);
        ab.scale.set(1.1, 0.6, 0.5);
        group.add(ab);
    }
    // Head
    const headGeometry = new THREE.SphereGeometry(0.22, 32, 24);
    headGeometry.computeBoundingBox();
    createGradientGeometry(headGeometry, new THREE.Color(0x9C6B3B), new THREE.Color(0x6B3A1B));
    const headMesh = new THREE.Mesh(headGeometry, skinMaterial);
    headMesh.position.y = 2.3;
    headMesh.castShadow = true;
    group.add(headMesh);
    // Eyes (realistic: sclera, iris, pupil, cornea highlight)
    function createRealisticEye(x, y, z) {
        const eyeGroup = new THREE.Group();
        // Sclera (white)
        const scleraGeometry = new THREE.SphereGeometry(0.028, 20, 16);
        const scleraMaterial = new THREE.MeshLambertMaterial({ color: 0xfaf9f6 });
        const sclera = new THREE.Mesh(scleraGeometry, scleraMaterial);
        eyeGroup.add(sclera);
        // Iris (brown)
        const irisGeometry = new THREE.CircleGeometry(0.012, 20);
        const irisMaterial = new THREE.MeshLambertMaterial({ color: 0x6B3A1B });
        const iris = new THREE.Mesh(irisGeometry, irisMaterial);
        iris.position.z = 0.027;
        eyeGroup.add(iris);
        // Pupil (black)
        const pupilGeometry = new THREE.CircleGeometry(0.005, 16);
        const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.z = 0.028;
        eyeGroup.add(pupil);
        // Cornea highlight (glossy reflection)
        const highlightGeometry = new THREE.CircleGeometry(0.003, 8);
        const highlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(0.004, 0.006, 0.029);
        eyeGroup.add(highlight);
        // Slight bulge for cornea
        eyeGroup.scale.set(1, 1, 1.08);
        eyeGroup.position.set(x, y, z);
        return eyeGroup;
    }
    const leftEye = createRealisticEye(-0.07, 2.36, 0.18);
    group.add(leftEye);
    const rightEye = createRealisticEye(0.07, 2.36, 0.18);
    group.add(rightEye);
    // Add facial features
    createFaceFeatures(group, skinMaterial);
    // Hair (same as before)
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x2C1810 });
    const topHairGeometry = new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const topHair = new THREE.Mesh(topHairGeometry, hairMaterial);
    topHair.position.set(0, 2.42, -0.08);
    topHair.scale.set(1, 0.7, 1.2);
    group.add(topHair);
    const sideHairGeometry = new THREE.SphereGeometry(0.12, 16, 12);
    const leftSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    leftSideHair.position.set(-0.18, 2.35, -0.05);
    leftSideHair.scale.set(1, 0.8, 0.9);
    group.add(leftSideHair);
    const rightSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    rightSideHair.position.set(0.18, 2.35, -0.05);
    rightSideHair.scale.set(1, 0.8, 0.9);
    group.add(rightSideHair);
    const backHairGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
    backHair.position.set(0, 2.38, -0.15);
    backHair.scale.set(1.2, 0.6, 1);
    group.add(backHair);
    // Beard (same as before)
    const beardMaterial = new THREE.MeshLambertMaterial({ color: 0x1A0F08 });
    const beardGeometry = new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.4);
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
    // Shoulders (deltoids, larger and rounder)
    const shoulderGeometry = new THREE.SphereGeometry(0.13, 20, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
    leftShoulder.position.set(-0.41, 1.95, 0);
    leftShoulder.scale.set(1.2, 0.9, 1.1);
    group.add(leftShoulder);
    const rightShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
    rightShoulder.position.set(0.41, 1.95, 0);
    rightShoulder.scale.set(1.2, 0.9, 1.1);
    group.add(rightShoulder);
    // Arms (thicker, with biceps/triceps bulges)
    const upperArmGeometry = new THREE.CylinderGeometry(0.11, 0.09, 0.45, 24);
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
    leftUpperArm.position.set(-0.38, 1.6, 0);
    leftUpperArm.rotation.z = Math.PI / 12;
    leftUpperArm.castShadow = true;
    group.add(leftUpperArm);
    const rightUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
    rightUpperArm.position.set(0.38, 1.6, 0);
    rightUpperArm.rotation.z = -Math.PI / 12;
    rightUpperArm.castShadow = true;
    group.add(rightUpperArm);
    // Biceps bulge
    const bicepGeometry = new THREE.SphereGeometry(0.10, 16, 12);
    const leftBicep = new THREE.Mesh(bicepGeometry, skinMaterial);
    leftBicep.position.set(-0.38, 1.45, 0.04);
    leftBicep.scale.set(1.2, 0.7, 1.1);
    group.add(leftBicep);
    const rightBicep = new THREE.Mesh(bicepGeometry, skinMaterial);
    rightBicep.position.set(0.38, 1.45, 0.04);
    rightBicep.scale.set(1.2, 0.7, 1.1);
    group.add(rightBicep);
    // Lower arms (thicker forearms)
    const forearmGeometry = new THREE.CylinderGeometry(0.09, 0.07, 0.38, 20);
    const leftForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
    leftForearm.position.set(-0.41, 1.2, 0);
    leftForearm.rotation.z = Math.PI / 12;
    leftForearm.castShadow = true;
    group.add(leftForearm);
    const rightForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
    rightForearm.position.set(0.41, 1.2, 0);
    rightForearm.rotation.z = -Math.PI / 12;
    rightForearm.castShadow = true;
    group.add(rightForearm);
    // Hands (fingers as small spheres)
    const handGeometry = new THREE.SphereGeometry(0.08, 16, 12);
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(-0.45, 0.95, 0);
    leftHand.castShadow = true;
    group.add(leftHand);
    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(0.45, 0.95, 0);
    rightHand.castShadow = true;
    group.add(rightHand);
    // Fingers (simple, for realism)
    for (let i = -2; i <= 2; i++) {
        const finger = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), skinMaterial);
        finger.position.set(-0.45 + i * 0.025, 0.91, 0.07);
        group.add(finger);
    }
    for (let i = -2; i <= 2; i++) {
        const finger = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), skinMaterial);
        finger.position.set(0.45 + i * 0.025, 0.91, 0.07);
        group.add(finger);
    }
    // Legs (thicker, more muscular)
    const thighGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.55, 24);
    const leftThigh = new THREE.Mesh(thighGeometry, skinMaterial);
    leftThigh.position.set(-0.16, 0.65, 0);
    leftThigh.castShadow = true;
    group.add(leftThigh);
    const rightThigh = new THREE.Mesh(thighGeometry, skinMaterial);
    rightThigh.position.set(0.16, 0.65, 0);
    rightThigh.castShadow = true;
    group.add(rightThigh);
    // Calves
    const calfGeometry = new THREE.CylinderGeometry(0.11, 0.09, 0.45, 20);
    const leftCalf = new THREE.Mesh(calfGeometry, skinMaterial);
    leftCalf.position.set(-0.16, 0.25, 0);
    leftCalf.castShadow = true;
    group.add(leftCalf);
    const rightCalf = new THREE.Mesh(calfGeometry, skinMaterial);
    rightCalf.position.set(0.16, 0.25, 0);
    rightCalf.castShadow = true;
    group.add(rightCalf);
    // Shoes (with sole and laces)
    const shoeGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.35);
    const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const soleMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.set(-0.15, -0.15, 0.1);
    leftShoe.castShadow = true;
    group.add(leftShoe);
    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.35), soleMaterial);
    leftSole.position.set(-0.15, -0.19, 0.1);
    group.add(leftSole);
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.set(0.15, -0.15, 0.1);
    rightShoe.castShadow = true;
    group.add(rightShoe);
    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.35), soleMaterial);
    rightSole.position.set(0.15, -0.19, 0.1);
    group.add(rightSole);
    // Laces (simple cylinders)
    for (let i = -2; i <= 2; i++) {
        const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        lace.position.set(-0.15, -0.13, 0.07 + i * 0.04);
        lace.rotation.z = Math.PI / 2;
        group.add(lace);
        const lace2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        lace2.position.set(0.15, -0.13, 0.07 + i * 0.04);
        lace2.rotation.z = Math.PI / 2;
        group.add(lace2);
    }
    // Nike swoosh details on shoes
    const swooshGeometry = new THREE.PlaneGeometry(0.06, 0.03);
    const swooshMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leftSwoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    leftSwoosh.position.set(-0.15, -0.12, 0.18);
    group.add(leftSwoosh);
    const rightSwoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    rightSwoosh.position.set(0.15, -0.12, 0.18);
    group.add(rightSwoosh);
    // Create Lakers Jersey
    createJersey(group);
    lebronModel = group;
    scene.add(lebronModel);
}

function createJersey(parentGroup) {
    // Jersey base - yellow Lakers color, with subtle bump (simulated fabric)
    const jerseyGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 64, 4, false);
    const jerseyMaterial = new THREE.MeshLambertMaterial({ color: 0xFDB927 });
    jerseyMesh = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
    jerseyMesh.position.y = 1.5;
    jerseyMesh.castShadow = true;
    // Simulate stitched texture with small dots
    for (let i = 0; i < 32; i++) {
        const stitch = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 6, 4),
            new THREE.MeshLambertMaterial({ color: 0xE6B800 })
        );
        const theta = (i / 32) * Math.PI * 2;
        stitch.position.set(0.4 * Math.cos(theta), 1.9, 0.4 * Math.sin(theta));
        parentGroup.add(stitch);
    }
    parentGroup.add(jerseyMesh);
    // Collar (purple trim, torus)
    const collarGeometry = new THREE.TorusGeometry(0.4, 0.015, 16, 100);
    const collarMaterial = new THREE.MeshLambertMaterial({ color: 0x552583 });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.y = 1.9;
    collar.rotation.x = Math.PI / 2;
    parentGroup.add(collar);
    // Armholes (purple trim, torus segments)
    const armholeGeometry = new THREE.TorusGeometry(0.21, 0.012, 16, 60, Math.PI * 1.2);
    const leftArmhole = new THREE.Mesh(armholeGeometry, collarMaterial);
    leftArmhole.position.set(-0.32, 1.7, 0);
    leftArmhole.rotation.z = Math.PI / 2.2;
    parentGroup.add(leftArmhole);
    const rightArmhole = new THREE.Mesh(armholeGeometry, collarMaterial);
    rightArmhole.position.set(0.32, 1.7, 0);
    rightArmhole.rotation.z = -Math.PI / 2.2;
    parentGroup.add(rightArmhole);
    // Side trims (thinner, more accurate)
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.8, 0.6), collarMaterial);
    leftTrim.position.set(-0.38, 1.5, 0);
    parentGroup.add(leftTrim);
    const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.8, 0.6), collarMaterial);
    rightTrim.position.set(0.38, 1.5, 0);
    parentGroup.add(rightTrim);
    // Add white piping (thin white lines)
    const pipingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const leftPiping = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.8, 0.61), pipingMaterial);
    leftPiping.position.set(-0.36, 1.5, 0);
    parentGroup.add(leftPiping);
    const rightPiping = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.8, 0.61), pipingMaterial);
    rightPiping.position.set(0.36, 1.5, 0);
    parentGroup.add(rightPiping);
    // "LAKERS" text (simulated as purple extruded text)
    const lakersTextGeometry = new THREE.BoxGeometry(0.28, 0.07, 0.02);
    const lakersTextMaterial = new THREE.MeshLambertMaterial({ color: 0x552583 });
    const lakersText = new THREE.Mesh(lakersTextGeometry, lakersTextMaterial);
    lakersText.position.set(0, 1.7, 0.41);
    lakersText.scale.set(1.1, 1, 1);
    parentGroup.add(lakersText);
    // Number "23" (simulated as two purple extruded numbers)
    const number2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.02), lakersTextMaterial);
    number2.position.set(-0.06, 1.45, 0.41);
    parentGroup.add(number2);
    const number3 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.02), lakersTextMaterial);
    number3.position.set(0.06, 1.45, 0.41);
    parentGroup.add(number3);
    // Add white outline to numbers (simulate with slightly larger white boxes behind)
    const outlineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const number2Outline = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.01), outlineMaterial);
    number2Outline.position.set(-0.06, 1.45, 0.405);
    parentGroup.add(number2Outline);
    const number3Outline = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.01), outlineMaterial);
    number3Outline.position.set(0.06, 1.45, 0.405);
    parentGroup.add(number3Outline);
    // Shorts - yellow with purple trim, with subtle bump
    const shortsGeometry = new THREE.CylinderGeometry(0.35, 0.3, 0.4, 48, 2, false);
    const shortsMesh = new THREE.Mesh(shortsGeometry, jerseyMaterial);
    shortsMesh.position.y = 0.8;
    shortsMesh.castShadow = true;
    parentGroup.add(shortsMesh);
    // Purple waistband
    const waistbandGeometry = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 32);
    const waistbandMesh = new THREE.Mesh(waistbandGeometry, collarMaterial);
    waistbandMesh.position.y = 0.98;
    parentGroup.add(waistbandMesh);
    // Side stripes on shorts (purple with white piping)
    const stripeGeometry = new THREE.BoxGeometry(0.02, 0.4, 0.3);
    const leftStripe = new THREE.Mesh(stripeGeometry, collarMaterial);
    leftStripe.position.set(-0.32, 0.8, 0);
    parentGroup.add(leftStripe);
    const rightStripe = new THREE.Mesh(stripeGeometry, collarMaterial);
    rightStripe.position.set(0.32, 0.8, 0);
    parentGroup.add(rightStripe);
    const leftStripePiping = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.4, 0.31), pipingMaterial);
    leftStripePiping.position.set(-0.31, 0.8, 0);
    parentGroup.add(leftStripePiping);
    const rightStripePiping = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.4, 0.31), pipingMaterial);
    rightStripePiping.position.set(0.31, 0.8, 0);
    parentGroup.add(rightStripePiping);
    // Belt (simulated as a torus)
    const beltGeometry = new THREE.TorusGeometry(0.36, 0.012, 16, 100);
    const beltMaterial = collarMaterial;
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = 1.0;
    belt.rotation.x = Math.PI / 2;
    parentGroup.add(belt);
    // "wish" sponsor logo (white box with blue text simulation)
    const wishLogoGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.01);
    const wishLogoMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const wishLogo = new THREE.Mesh(wishLogoGeometry, wishLogoMaterial);
    wishLogo.position.set(-0.23, 1.85, 0.41);
    parentGroup.add(wishLogo);
    // NBA logo (red/blue/white stripes)
    const nbaLogoGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.01);
    const nbaRed = new THREE.Mesh(nbaLogoGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    nbaRed.position.set(0.23, 1.85, 0.41);
    parentGroup.add(nbaRed);
    const nbaBlue = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.011), new THREE.MeshLambertMaterial({ color: 0x0033cc }));
    nbaBlue.position.set(0.215, 1.85, 0.415);
    parentGroup.add(nbaBlue);
    const nbaWhite = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.012), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    nbaWhite.position.set(0.23, 1.85, 0.416);
    parentGroup.add(nbaWhite);
    // Arm sleeves/bands (unchanged)
    const armBandGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16);
    const armBandMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leftArmBand = new THREE.Mesh(armBandGeometry, armBandMaterial);
    leftArmBand.position.set(-0.35, 1.5, 0);
    leftArmBand.rotation.z = Math.PI / 12;
    parentGroup.add(leftArmBand);
    const rightArmBand = new THREE.Mesh(armBandGeometry, armBandMaterial);
    rightArmBand.position.set(0.35, 1.5, 0);
    rightArmBand.rotation.z = -Math.PI / 12;
    parentGroup.add(rightArmBand);
}

function createBasketball() {
    // Basketball with bump effect
    const ballGeometry = new THREE.SphereGeometry(0.12, 32, 24);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    basketball = new THREE.Mesh(ballGeometry, ballMaterial);
    basketball.position.set(-0.6, 0.95, 0.2);
    basketball.castShadow = true;
    // Simulate bumps with small spheres
    for (let i = 0; i < 12; i++) {
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 4), new THREE.MeshLambertMaterial({ color: 0xB05A1E }));
        const theta = (i / 12) * Math.PI * 2;
        bump.position.set(
            basketball.position.x + 0.12 * Math.cos(theta),
            basketball.position.y + 0.12 * Math.sin(theta),
            basketball.position.z + 0.01 * Math.sin(i)
        );
        scene.add(bump);
    }
    // Basketball lines
    const lineGeometry = new THREE.TorusGeometry(0.12, 0.005, 8, 40);
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
    // Add "Spalding" text texture simulation
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
