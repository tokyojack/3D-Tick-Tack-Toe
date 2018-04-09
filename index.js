var turnColor = {
  X: new THREE.Color(0, 0.18823529411764706, 0.9411764705882353), // Blue
  O: new THREE.Color(0.9411764705882353, 0, 0) //Red
};

var boardController = (() => {
  var playerTurn = "X";

  return {
    getTurn: () => {
      return playerTurn;
    },
    getTurnColor: () => {
      return playerTurn == "X" ? turnColor.X : turnColor.O;
    },
    switchTeams: () => {
      playerTurn = playerTurn == "O" ? "X" : "O";
    }
  };
})();

var winningController = (() => {
  var hasWon = false;

  function XYZToCord(x, y, z) {
    return {
      x: x,
      y: y,
      z: z
    };
  }

  function getOtherCorner(cord) {
    if (cord.y == 2) return cord;

    var x = 1;
    var y = 1;
    var z = 1;

    if (cord.x == 1) {
      x = 3;
    }
    if (cord.x == 3) {
      x = 1;
    }

    if (cord.z == 1) {
      z = 3;
    }

    if (cord.z == 3) {
      z = 1;
    }

    if (cord.y == 1) {
      y = 3;
    } else if (cord.y == 3) {
      y = 1;
    }

    return XYZToCord(x, y, z);
  }

  function flip(i) {
    if (i == 3) return 1;
    if (i == 2) return 2; // Not needed but helps understand what's happening
    if (i == 1) return 3;

    return i;
  }

  function checkMapForWin(map) {
    var totalAmountOfX = 0;
    var totalAmountOfO = 0;

    for (var [key, value] of map) {
      value == "X" ? totalAmountOfX++ : totalAmountOfO++;
    }

    if (hasWon) return;

    if (totalAmountOfO === 3 || totalAmountOfX === 3)
      hasWon = true;

    map.clear();
  }

  function checkColor(x, y, z, map, scene) {
    var cord = `${x},${y},${z}`;
    var cube = scene.getObjectByName(cord);

    if (typeof cube !== 'undefined') {
      var color = cube.material.color;

      if (color.equals(turnColor.X)) {
        map.set(cord, "X");
      }

      if (color.equals(turnColor.O)) {
        map.set(cord, "O");
      }
    }
  }

  return {
    checkForWin: (cube, scene) => {
      var xyz = cube.name.split(",");

      var cords = {
        x: parseInt(xyz[0]),
        y: parseInt(xyz[1]),
        z: parseInt(xyz[2])
      };

      var coloredCubes = new Map();

      for (var x1 = cords.x; x1 < 4; x1++) {
        checkColor(x1, cords.y, cords.z, coloredCubes, scene);

        for (var x2 = cords.x; x2 > 0; x2--) {
          checkColor(x2, cords.y, cords.z, coloredCubes, scene);
        }
      }

      if (checkMapForWin(coloredCubes))
        return;


      for (var y1 = cords.y; y1 < 4; y1++) {
        checkColor(cords.x, y1, cords.z, coloredCubes, scene);

        for (var y2 = cords.y; y2 > 0; y2--) {
          checkColor(cords.x, y2, cords.z, coloredCubes, scene);
        }
      }

      if (checkMapForWin(coloredCubes))
        return;


      for (var z1 = cords.z; z1 < 4; z1++) {
        checkColor(cords.x, cords.y, z1, coloredCubes, scene);

        for (var z2 = cords.z; z2 > 0; z2--) {
          checkColor(cords.x, cords.y, z2, coloredCubes, scene);
        }
      }

      if (checkMapForWin(coloredCubes))
        return;


      for (var xy = 1; xy < 4; xy++) {
        checkColor(xy, xy, cords.z, coloredCubes, scene);
      }

      if (checkMapForWin(coloredCubes))
        return;

      for (var xy = 1; xy < 4; xy++) {
        checkColor(cords.x, xy, xy, coloredCubes, scene);
      }


      if (checkMapForWin(coloredCubes))
        return;

      for (var xy = 1; xy < 4; xy++) {
        checkColor(cords.x, xy, flip(xy), coloredCubes, scene);
      }

      if (checkMapForWin(coloredCubes))
        return;


      for (var xy = 1; xy < 4; xy++) {
        checkColor(flip(xy), xy, cords.z, coloredCubes, scene);
      }


      if (checkMapForWin(coloredCubes))
        return;

      var otherCornerCords = getOtherCorner(cords);
      checkColor(
        otherCornerCords.x,
        otherCornerCords.y,
        otherCornerCords.z,
        coloredCubes,
        scene
      );
      checkColor(2, 2, 2, coloredCubes, scene);
      checkColor(cords.x, cords.y, cords.z, coloredCubes, scene);

      if (checkMapForWin(coloredCubes)) 
        return;

    },
    hasWon: () => {
      return hasWon;
    }
  };
})();

var UIController = (function () {
  var DOMstrings = {
    playerTurn: "#playerTurn"
  };

  function getTurnColoredTextSpan(turn) {
    return (
      "<span class='" +
      (turn == "X" ? "redTextColor" : "blueTextColor") +
      "'>" +
      turn +
      "</span>"
    );
  }

  return {
    toastTurn: function (playerTurn) {
      toastr.clear();

      toastr.options = {
        positionClass: "toast-top-right",
        preventDuplicates: true,
        showDuration: "100",
        hideDuration: "100",
        timeOut: "1475",
        extendedTimeOut: "1"
      };
      toastr["info"](getTurnColoredTextSpan(playerTurn) + "'s turn");
    },
    toastWin: function (playerTurn) {
      toastr.clear();

      toastr.options = {
        positionClass: "toast-top-full-width",
        showDuration: "100",
        hideDuration: "100",
        timeOut: "0",
        extendedTimeOut: "1000"
      };
      toastr["success"](getTurnColoredTextSpan(playerTurn) + " won!");
    }
  };
})();

var ThreeDeeController = (() => {
  var container;
  var camera, scene, renderer;
  var mesh, geometry;

  var raycaster;
  var mouse;

  var objects = [];

  function addCube() {
    if (mesh !== undefined) {
      scene.remove(mesh);
      geometry.dispose();
    }

    geometry = new THREE.BoxGeometry(250, 250, 250, 0, 0, 0);
    geometry.computeBoundingSphere();

    var material = new THREE.MeshBasicMaterial({
      opacity: 0
    });
    material.transparent = true;

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    for (var x = -1; x < 2; x++) {
      for (var y = -1; y < 2; y++) {
        for (var z = -1; z < 2; z++) {
          var hex = parseInt("0xFFFD12", 16);

          var geometry_obj = new THREE.BoxGeometry(50, 50, 50, 0, 0, 0);
          var material_obj = new THREE.MeshBasicMaterial({
            wireframe: false,
            wireframeLinewidth: 0,
            color: hex
          });
          var mesh2 = new THREE.Mesh(geometry_obj, material_obj);

          mesh2.name = x + 2 + "," + (y + 2) + "," + (z + 2);

          var eMaterial = new THREE.LineBasicMaterial({
            color: 0x0000000,
            linewidth: 5
          });
          var edges = new THREE.LineSegments(geometry_obj, eMaterial);

          mesh2.add(edges);
          mesh2.position.set(67.5 * x, 67.5 * y, 67.5 * z);

          mesh.add(mesh2);
          objects.push(mesh2);
        }
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  return {
    init: () => {
      container = document.getElementById("container");

      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1,
        1000
      );
      camera.position.z = 500;

      scene = new THREE.Scene();

      addCube();

      renderer = new THREE.WebGLRenderer({
        antialias: true
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      var controls = new THREE.OrbitControls(camera, renderer.domElement);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      window.addEventListener(
        "resize",
        function () {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();

          renderer.setSize(window.innerWidth, window.innerHeight);
        },
        false
      );

      animate();
    },
    getMouse: () => {
      return mouse;
    },
    getCamera: () => {
      return camera;
    },
    getRaycaster: () => {
      return raycaster;
    },
    getObjects: () => {
      return objects;
    },
    getRenderer: () => {
      return renderer;
    },
    getScene: () => {
      return scene;
    }
  };
})();

var controller = ((boardCtrl, UICtrl, winningCtrl, ThreeDeeCtrl) => {
  var setupEventListeners = function setupEventListeners() {
    document.addEventListener(
      "mousedown",
      event => {
        if (winningCtrl.hasWon()) return;

        event.preventDefault();

        var mouse = ThreeDeeCtrl.getMouse();
        var camera = ThreeDeeCtrl.getCamera();
        var renderer = ThreeDeeCtrl.getRenderer();
        var raycaster = ThreeDeeCtrl.getRaycaster();

        mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(ThreeDeeCtrl.getObjects());

        if (intersects.length > 0) {
          var color = intersects[0].object.material.color;

          if (!(color.r == 1 && color.g == 0.9921568627450981,
              color.b == 0.07058823529411765))
            return;

          intersects[0].object.material.color.set(boardCtrl.getTurnColor());
          UIController.toastTurn(boardCtrl.getTurn());

          boardCtrl.switchTeams();

          winningCtrl.checkForWin(
            intersects[0].object,
            ThreeDeeCtrl.getScene()
          );

          if (winningCtrl.hasWon()) {
            UICtrl.toastWin(boardCtrl.getTurn());
          }
        }
      },
      false
    );
  };

  return {
    init: () => {
      setupEventListeners();
      ThreeDeeCtrl.init();
    }
  };
})(boardController, UIController, winningController, ThreeDeeController);

controller.init();