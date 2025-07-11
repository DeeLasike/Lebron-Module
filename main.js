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
    // Shoes (LeBron 21 "Wolf Grey")
    function createLeBron21Shoe(isLeft) {
        const shoeGroup = new THREE.Group();
        // Main upper (light gray, slightly textured) - fallback to Cylinder + Spheres
        const bodyGeometry = new THREE.CylinderGeometry(0.085, 0.085, 0.18, 16);
        const toeCapGeometry = new THREE.SphereGeometry(0.085, 16, 12, 0, Math.PI);
        const heelCapGeometry = new THREE.SphereGeometry(0.085, 16, 12, 0, Math.PI);
        const upperMaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
        const shoeBody = new THREE.Mesh(bodyGeometry, upperMaterial);
        shoeBody.position.set(0, 0, 0);
        shoeBody.castShadow = true;
        shoeGroup.add(shoeBody);
        const toeCap = new THREE.Mesh(toeCapGeometry, upperMaterial);
        toeCap.position.set(0, 0.09, 0);
        toeCap.rotation.x = Math.PI / 2;
        shoeGroup.add(toeCap);
        const heelCap = new THREE.Mesh(heelCapGeometry, upperMaterial);
        heelCap.position.set(0, -0.09, 0);
        heelCap.rotation.x = -Math.PI / 2;
        shoeGroup.add(heelCap);
        // Subtle texture lines (simulate with thin boxes)
        for (let i = -2; i <= 2; i++) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 0.002, 0.01),
                new THREE.MeshLambertMaterial({ color: 0xb0b0b0 })
            );
            line.position.set(0, 0.03 - i * 0.01, -0.13 + i * 0.04);
            shoeGroup.add(line);
        }
        // Blue accent panel (side)
        const bluePanelGeometry = new THREE.BoxGeometry(0.07, 0.08, 0.01);
        const bluePanelMaterial = new THREE.MeshLambertMaterial({ color: 0x1ca9e6 });
        const bluePanel = new THREE.Mesh(bluePanelGeometry, bluePanelMaterial);
        bluePanel.position.set(0.06, 0.02, 0.09);
        bluePanel.rotation.y = Math.PI / 8;
        shoeGroup.add(bluePanel);
        // Pink translucent sole
        const soleGeometry = new THREE.BoxGeometry(0.18, 0.03, 0.36);
        const soleMaterial = new THREE.MeshLambertMaterial({ color: 0xffb6c1, transparent: true, opacity: 0.7 });
        const sole = new THREE.Mesh(soleGeometry, soleMaterial);
        sole.position.set(0, -0.07, 0);
        shoeGroup.add(sole);
        // Blue/navy heel accent
        const heelGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.08);
        const heelMaterial = new THREE.MeshLambertMaterial({ color: 0x1ca9e6 });
        const heel = new THREE.Mesh(heelGeometry, heelMaterial);
        heel.position.set(0, -0.03, -0.16);
        shoeGroup.add(heel);
        const navyGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.08);
        const navyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a237e });
        const navy = new THREE.Mesh(navyGeometry, navyMaterial);
        navy.position.set(0, -0.01, -0.16);
        shoeGroup.add(navy);
        // Tongue (gray, with simulated text)
        const tongueGeometry = new THREE.BoxGeometry(0.07, 0.04, 0.13);
        const tongueMaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
        const tongue = new THREE.Mesh(tongueGeometry, tongueMaterial);
        tongue.position.set(0, 0.045, 0.07);
        shoeGroup.add(tongue);
        // "LBJ" and Nike text (simulated with small black boxes)
        const textGeometry = new THREE.BoxGeometry(0.03, 0.01, 0.001);
        const textMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const lbjText = new THREE.Mesh(textGeometry, textMaterial);
        lbjText.position.set(0, 0.06, 0.13);
        shoeGroup.add(lbjText);
        // Laces (light gray, detailed)
        for (let i = 0; i < 6; i++) {
            const lace = new THREE.Mesh(
                new THREE.CylinderGeometry(0.004, 0.004, 0.11, 8),
                new THREE.MeshLambertMaterial({ color: 0xd3d3d3 })
            );
            lace.position.set(0, 0.04 - i * 0.012, 0.04 + i * 0.018);
            lace.rotation.z = Math.PI / 2;
            shoeGroup.add(lace);
        }
        // Iridescent Nike swoosh (yellow-pink gradient, black tail)
        const swooshShape = new THREE.Shape();
        swooshShape.moveTo(-0.03, 0);
        swooshShape.quadraticCurveTo(0.01, 0.03, 0.06, 0.01);
        swooshShape.quadraticCurveTo(0.03, -0.01, 0.06, -0.03);
        const swooshGeometry = new THREE.ExtrudeGeometry(swooshShape, { depth: 0.004, bevelEnabled: false });
        // Gradient simulation: use yellow-pink for main, black for tail
        const swooshMaterial = new THREE.MeshLambertMaterial({ color: 0xffe066 });
        const swoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
        swoosh.position.set(0.04, -0.01, 0.13);
        swoosh.rotation.x = -Math.PI / 2.1;
        shoeGroup.add(swoosh);
        // Pink overlay for iridescent effect
        const swooshOverlayMaterial = new THREE.MeshLambertMaterial({ color: 0xff69b4, transparent: true, opacity: 0.5 });
        const swooshOverlay = new THREE.Mesh(swooshGeometry, swooshOverlayMaterial);
        swooshOverlay.position.set(0.04, -0.012, 0.132);
        swooshOverlay.rotation.x = -Math.PI / 2.1;
        shoeGroup.add(swooshOverlay);
        // Black tail
        const tailGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.004);
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0.07, -0.01, 0.13);
        shoeGroup.add(tail);
        // Mirror for right shoe
        if (!isLeft) shoeGroup.scale.x = -1;
        return shoeGroup;
    }
    // Left shoe
    const leftShoe = createLeBron21Shoe(true);
    leftShoe.position.set(-0.15, -0.15, 0.1);
    group.add(leftShoe);
    // Right shoe
    const rightShoe = createLeBron21Shoe(false);
    rightShoe.position.set(0.15, -0.15, 0.1);
    group.add(rightShoe);
    // Create Lakers Jersey
    createJersey(group);
    lebronModel = group;
    scene.add(lebronModel);
}

function createJersey(parentGroup) {
    // Jersey base - yellow mesh, more fitted shape
    const jerseyGeometry = new THREE.CylinderGeometry(0.39, 0.36, 0.8, 80, 4, false);
    const jerseyMaterial = new THREE.MeshLambertMaterial({ color: 0xFDB927 });
    jerseyMesh = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
    jerseyMesh.position.y = 1.5;
    jerseyMesh.castShadow = true;
    parentGroup.add(jerseyMesh);
    // Collar: white and purple layered trim
    const collarWhite = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.012, 16, 100),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    collarWhite.position.y = 1.9;
    collarWhite.rotation.x = Math.PI / 2;
    parentGroup.add(collarWhite);
    const collarPurple = new THREE.Mesh(
        new THREE.TorusGeometry(0.375, 0.008, 16, 100),
        new THREE.MeshLambertMaterial({ color: 0x552583 })
    );
    collarPurple.position.y = 1.9;
    collarPurple.rotation.x = Math.PI / 2;
    parentGroup.add(collarPurple);
    // Armholes: white and purple layered trim
    function addArmhole(x) {
        const armholeWhite = new THREE.Mesh(
            new THREE.TorusGeometry(0.21, 0.012, 16, 60, Math.PI * 1.2),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        armholeWhite.position.set(x, 1.7, 0);
        armholeWhite.rotation.z = x < 0 ? Math.PI / 2.2 : -Math.PI / 2.2;
        parentGroup.add(armholeWhite);
        const armholePurple = new THREE.Mesh(
            new THREE.TorusGeometry(0.197, 0.008, 16, 60, Math.PI * 1.2),
            new THREE.MeshLambertMaterial({ color: 0x552583 })
        );
        armholePurple.position.set(x, 1.7, 0);
        armholePurple.rotation.z = x < 0 ? Math.PI / 2.2 : -Math.PI / 2.2;
        parentGroup.add(armholePurple);
    }
    addArmhole(-0.32);
    addArmhole(0.32);
    // Side trims (thin white and purple stripes)
    const leftTrimWhite = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    leftTrimWhite.position.set(-0.38, 1.5, 0);
    parentGroup.add(leftTrimWhite);
    const leftTrimPurple = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: 0x552583 }));
    leftTrimPurple.position.set(-0.36, 1.5, 0);
    parentGroup.add(leftTrimPurple);
    const rightTrimWhite = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    rightTrimWhite.position.set(0.38, 1.5, 0);
    parentGroup.add(rightTrimWhite);
    const rightTrimPurple = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: 0x552583 }));
    rightTrimPurple.position.set(0.36, 1.5, 0);
    parentGroup.add(rightTrimPurple);
    // "LAKERS" text (purple with white outline, slanted)
    const lakersText = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.09, 0.01),
        new THREE.MeshLambertMaterial({ color: 0x552583 })
    );
    lakersText.position.set(0, 1.7, 0.41);
    lakersText.rotation.z = -0.08;
    parentGroup.add(lakersText);
    const lakersOutline = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.11, 0.008),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    lakersOutline.position.set(0, 1.7, 0.406);
    lakersOutline.rotation.z = -0.08;
    parentGroup.add(lakersOutline);
    // Nike swoosh (blue, top left)
    const swooshGeometry = new THREE.PlaneGeometry(0.06, 0.03);
    const swooshMaterial = new THREE.MeshLambertMaterial({ color: 0x1A237E });
    const swoosh = new THREE.Mesh(swooshGeometry, swooshMaterial);
    swoosh.position.set(-0.18, 1.82, 0.41);
    swoosh.rotation.z = -0.2;
    parentGroup.add(swoosh);
    // Number "23" (purple with white outline, bold)
    function addNumber(x) {
        const num = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.01), new THREE.MeshLambertMaterial({ color: 0x552583 }));
        num.position.set(x, 1.45, 0.41);
        parentGroup.add(num);
        const numOutline = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.008), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        numOutline.position.set(x, 1.45, 0.406);
        parentGroup.add(numOutline);
    }
    addNumber(-0.09);
    addNumber(0.09);
    // NBA Authentics patch (bottom left)
    const patchGeometry = new THREE.BoxGeometry(0.13, 0.04, 0.01);
    const patchMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.position.set(-0.18, 1.12, 0.41);
    parentGroup.add(patch);
    // Shorts and other details remain unchanged
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
