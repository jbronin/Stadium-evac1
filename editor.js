const svgNamespace = "http://www.w3.org/2000/svg";
const plan = document.querySelector("#plan");
const layer = document.querySelector("#editable-layer");
const preview = document.querySelector("#draw-preview");
const planWrap = document.querySelector(".plan-wrap");
const editorHelp = document.querySelector("#editor-help");
const validationMessage = document.querySelector("#validation-message");
const readiness = document.querySelector(".ready-pill");
const runButton = document.querySelector("#run-button");
const undoButton = document.querySelector("#undo-tool");
const redoButton = document.querySelector("#redo-tool");
const placement = document.querySelector("#placement");
const doorWidthInput = document.querySelector("#door-width");
const animationSpeed = document.querySelector("#animation-speed");
const animationSpeedValue = document.querySelector("#animation-speed-value");
const overallDimensions = document.querySelector("#overall-dimensions");
const peopleLayer = document.querySelector("#people-layer");
const replayButton = document.querySelector("#replay-button");
let currentAnimation = null;
let animationTimer = null;

const initialItems = [
  { id: "portal-n", type: "portal", x1: 0, y1: -139, x2: 0, y2: -139, width: 6 },
  { id: "portal-e", type: "portal", x1: 139, y1: 0, x2: 139, y2: 0, width: 6 },
  { id: "portal-s", type: "portal", x1: 0, y1: 139, x2: 0, y2: 139, width: 6 },
  { id: "portal-w", type: "portal", x1: -139, y1: 0, x2: -139, y2: 0, width: 6 },
  { id: "exit-n", type: "door", x1: 0, y1: -184, x2: 0, y2: -184, width: 6 },
  { id: "exit-s", type: "door", x1: 0, y1: 184, x2: 0, y2: 184, width: 6 },
  { id: "exit-w", type: "door", x1: -184, y1: 0, x2: -184, y2: 0, width: 6 },
];

let items = copyItems(initialItems);
let selectedId = null;
let activeTool = "select";
let snapEnabled = true;
let nextId = 2;
let drawState = null;
let moveState = null;
let panState = null;
let undoStack = [];
let redoStack = [];
let zoom = 1;
let panX = 0;
let panY = 0;

const svgButtons = [...document.querySelectorAll("[data-tool]")];
const numberInputs = [
  document.querySelector("#people"),
  document.querySelector("#speed"),
  document.querySelector("#plan-width"),
  document.querySelector("#plan-length"),
  document.querySelector("#seed"),
  doorWidthInput,
];
const peopleInput = document.querySelector("#people");
const speedInput = document.querySelector("#speed");
const peopleSlider = document.querySelector("#people-slider");
const speedSlider = document.querySelector("#speed-slider");

function copyItems(value) {
  return value.map((item) => ({ ...item }));
}

function announce(message) {
  editorHelp.textContent = message;
}

function makeSvg(tag, attributes = {}) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function pointFromEvent(event) {
  const matrix = layer.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const point = plan.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return snapPoint({ x: local.x, y: local.y });
}

function snapPoint(point) {
  if (!snapEnabled) return point;
  const spacing = 8;
  return {
    x: Math.round(point.x / spacing) * spacing,
    y: Math.round(point.y / spacing) * spacing,
  };
}

function setTool(tool) {
  activeTool = tool;
  for (const button of svgButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.tool === tool));
  }
  document.querySelector("#delete-tool").setAttribute("aria-pressed", String(tool === "delete"));
  plan.classList.toggle("is-drawing", ["wall", "stair", "obstacle", "crowd", "door", "portal"].includes(tool));
  announce({
    select: "Select and drag an item to move it. Choose a drawing tool to add items.",
    wall: "Drag to draw a wall. Walls can divide the floor plan and may make areas unreachable.",
    portal: "Tap or click near the seating-bowl edge to add a bowl-to-hallway door.",
    door: "Tap or click near the outside edge to add an exterior exit.",
    stair: "Drag between two points to add a stair aisle.",
    obstacle: "Drag to draw an obstacle. Small tap creates a default-sized obstacle.",
    crowd: "Drag to draw a crowd placement region.",
    delete: "Select an item on the floor plan to delete it.",
    pan: "Drag the floor plan to pan. Use plus and minus to zoom.",
  }[tool]);
}

function createDoor(x, y, type = "door", width = Number(doorWidthInput.value)) {
  const point = snapDoorPoint(x, y, type);
  return {
    id: `${type}-${nextId++}`,
    type,
    x1: point.x,
    y1: point.y,
    x2: point.x,
    y2: point.y,
    width,
  };
}

function snapDoorPoint(x, y, type) {
  const angle = Math.atan2(y, x);
  const radius = type === "portal" ? 139 : 184;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function renderItems(validate = true) {
  layer.replaceChildren();
  for (const item of items) {
    const group = makeSvg("g", {
      class: `plan-object${item.id === selectedId ? " selected" : ""}`,
      "data-object-id": item.id,
      tabindex: "0",
      role: "button",
      "aria-label": objectLabel(item),
    });
    group.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectedId = item.id;
      if (item.type === "door" || item.type === "portal") doorWidthInput.value = String(item.width);
      renderItems();
      announce(`${objectLabel(item)} selected. Use Delete to remove it or drag it to move it.`);
    });

    if (item.type === "door" || item.type === "portal") {
      const angle = Math.atan2(item.y1, item.x1);
      const halfLength = Math.max(12, item.width * 0.866 / 2);
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const color = item.type === "portal" ? "#628eaa" : "#3b8b6c";
      const radius = item.type === "portal" ? 139 : 184;
      const leaves = item.type === "door" ? [[-halfLength, -4], [4, halfLength]] : [[-halfLength, halfLength]];
      for (const [start, end] of leaves) {
        group.append(makeSvg("line", {
          x1: item.x1 + tangentX * start,
          y1: item.y1 + tangentY * start,
          x2: item.x1 + tangentX * end,
          y2: item.y1 + tangentY * end,
          stroke: color, "stroke-width": "7", "stroke-linecap": "round",
          "vector-effect": "non-scaling-stroke",
        }));
      }
      group.append(makeSvg("circle", {
        cx: item.x1, cy: item.y1, r: "5", fill: "#fff",
        stroke: color, "stroke-width": "2",
        "vector-effect": "non-scaling-stroke",
      }));
      const labelRadius = item.type === "portal" ? radius + 14 : radius - 16;
      const label = makeSvg("text", {
        x: Math.cos(angle) * labelRadius,
        y: Math.sin(angle) * labelRadius,
        "text-anchor": "middle",
      });
      label.textContent = item.type === "portal" ? `${item.width} FT TO HALL` : `${item.width} FT EXIT`;
      group.append(label);
    } else if (item.type === "wall" || item.type === "stair") {
      group.append(makeSvg("line", {
        x1: item.x1, y1: item.y1, x2: item.x2, y2: item.y2,
        stroke: item.type === "stair" ? "#c58e36" : "#596b78",
        "stroke-width": item.type === "stair" ? "9" : "5",
        "stroke-linecap": "round",
        "vector-effect": "non-scaling-stroke",
      }));
      if (item.type === "stair") {
        const steps = makeSvg("line", {
          x1: item.x1 + (item.x2 - item.x1) * 0.25,
          y1: item.y1 + (item.y2 - item.y1) * 0.25,
          x2: item.x1 + (item.x2 - item.x1) * 0.75,
          y2: item.y1 + (item.y2 - item.y1) * 0.75,
          stroke: "#fff4db", "stroke-width": "2",
          "vector-effect": "non-scaling-stroke",
        });
        group.append(steps);
      }
    } else {
      const x = Math.min(item.x1, item.x2);
      const y = Math.min(item.y1, item.y2);
      const width = Math.abs(item.x2 - item.x1);
      const height = Math.abs(item.y2 - item.y1);
      group.append(makeSvg("rect", {
        x, y, width, height,
        fill: item.type === "crowd" ? "rgb(71 124 164 / 18%)" : "rgb(96 111 122 / 28%)",
        stroke: item.type === "crowd" ? "#477ca4" : "#667783",
        "stroke-width": "2",
        "stroke-dasharray": item.type === "crowd" ? "5 4" : "none",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    layer.append(group);
  }
  updateHistoryButtons();
  if (validate) updateValidation();
  updateFloorCaption();
}

function objectLabel(item) {
  if (item.type === "door") return `Exterior exit, ${item.width} feet wide`;
  if (item.type === "portal") return `Bowl-to-hallway door, ${item.width} feet wide`;
  return item.type === "crowd" ? "Crowd placement region" : item.type;
}

function updateHistoryButtons() {
  undoButton.disabled = undoStack.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

function saveUndo(previous = copyItems(items)) {
  undoStack.push(previous);
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function pushItem(item) {
  saveUndo();
  if (item.type === "crowd") items = items.filter((existing) => existing.type !== "crowd");
  items.push(item);
  selectedId = item.id;
  if (item.type === "crowd") placement.value = "region";
  renderItems();
}

function deleteSelected() {
  if (!selectedId) {
    announce("Select an item on the floor plan first, then choose Delete.");
    return;
  }
  const before = copyItems(items);
  items = items.filter((item) => item.id !== selectedId);
  selectedId = null;
  saveUndo(before);
  renderItems();
  announce("Selected item deleted.");
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(copyItems(items));
  items = undoStack.pop();
  selectedId = null;
  renderItems();
  announce("Last floor-plan edit undone.");
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(copyItems(items));
  items = redoStack.pop();
  selectedId = null;
  renderItems();
  announce("Floor-plan edit restored.");
}

function updateFloorCaption() {
  const exits = items.filter((item) => item.type === "door").length;
  const portals = items.filter((item) => item.type === "portal").length;
  const subtitle = document.querySelector("#floor-title").parentElement.querySelector(".panel-subtitle");
  subtitle.textContent = `${portals} bowl-to-hall doors · ${exits} exterior exits`;
  overallDimensions.textContent = `Floor plan: ${document.querySelector("#plan-width").value || "—"} × ${document.querySelector("#plan-length").value || "—"} ft`;
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function isBlocked(point) {
  for (const item of items) {
    if (item.type === "obstacle") {
      if (
        point.x >= Math.min(item.x1, item.x2) - 5 &&
        point.x <= Math.max(item.x1, item.x2) + 5 &&
        point.y >= Math.min(item.y1, item.y2) - 5 &&
        point.y <= Math.max(item.y1, item.y2) + 5
      ) return true;
    }
    if (item.type === "wall" && distanceToSegment(point, { x: item.x1, y: item.y1 }, { x: item.x2, y: item.y2 }) < 5) {
      return true;
    }
  }
  return false;
}

function inWalkableArea(point) {
  const radius = Math.hypot(point.x, point.y);
  return radius >= 53 && radius <= 174;
}

function findCell(point, cells) {
  let best = null;
  let bestDistance = Infinity;
  for (const cell of cells) {
    const distance = (cell.x - point.x) ** 2 + (cell.y - point.y) ** 2;
    if (distance < bestDistance && distance <= 24 ** 2) {
      best = cell;
      bestDistance = distance;
    }
  }
  return best;
}

function hasReachableExit(startPoint, doors, portals) {
  if (!inWalkableArea(startPoint) || isBlocked(startPoint)) return false;
  const cells = [];
  const byKey = new Map();
  const step = 8;
  for (let x = -176; x <= 176; x += step) {
    for (let y = -176; y <= 176; y += step) {
      const point = { x, y };
      if (!inWalkableArea(point) || isBlocked(point)) continue;
      const cell = { x, y, key: `${x},${y}` };
      cells.push(cell);
      byKey.set(cell.key, cell);
    }
  }
  const source = findCell(startPoint, cells);
  if (!source) return false;
  const queue = [source];
  const visited = new Set([source.key]);
  let portalReachable = false;
  let exitReachable = false;
  const offsets = [
    [-step, 0], [step, 0], [0, -step], [0, step],
    [-step, -step], [-step, step], [step, -step], [step, step],
  ];
  while (queue.length) {
    const current = queue.shift();
    for (const portal of portals) {
      if ((current.x - portal.x1) ** 2 + (current.y - portal.y1) ** 2 <= 15 ** 2) portalReachable = true;
    }
    for (const door of doors) {
      const ux = door.x1 / 184;
      const uy = door.y1 / 184;
      const goal = { x: ux * 168, y: uy * 168 };
      if ((current.x - goal.x) ** 2 + (current.y - goal.y) ** 2 <= 15 ** 2) exitReachable = true;
    }
    for (const [dx, dy] of offsets) {
      const next = byKey.get(`${current.x + dx},${current.y + dy}`);
      if (!next || visited.has(next.key)) continue;
      if (dx !== 0 && dy !== 0 && (isBlocked({ x: current.x + dx, y: current.y }) || isBlocked({ x: current.x, y: current.y + dy }))) continue;
      visited.add(next.key);
      queue.push(next);
    }
  }
  return portalReachable && exitReachable;
}

function doorIsBlocked(door) {
  const innerRadius = door.type === "portal" ? 122 : 168;
  const outerRadius = door.type === "portal" ? 139 : 184;
  for (let step = 1; step <= 8; step += 1) {
    const fraction = step / 8;
    const point = {
      x: door.x1 * (innerRadius + (outerRadius - innerRadius) * fraction) / outerRadius,
      y: door.y1 * (innerRadius + (outerRadius - innerRadius) * fraction) / outerRadius,
    };
    if (isBlocked(point)) return true;
  }
  return false;
}

function updateValidation() {
  const errors = [];
  peopleSlider.value = peopleInput.value;
  speedSlider.value = speedInput.value;
  for (const input of numberInputs) {
    input.setAttribute("aria-invalid", "false");
    const value = Number(input.value);
    const min = Number(input.min);
    const max = Number(input.max);
    const integerOnly = input.step === "1";
    const step = Number(input.step);
    const offStep = Number.isFinite(step) && step > 0 && Math.abs((value - min) / step - Math.round((value - min) / step)) > 1e-8;
    if (!input.value.trim() || !Number.isFinite(value) || value < min || value > max || (integerOnly && !Number.isInteger(value)) || offStep) {
      input.setAttribute("aria-invalid", "true");
      errors.push(`${input.labels?.[0]?.textContent || input.id} must be ${integerOnly ? "a whole number " : ""}from ${min} to ${max}${offStep ? ` in increments of ${step}` : ""}.`);
    }
  }

  const doors = items.filter((item) => item.type === "door");
  const regions = items.filter((item) => item.type === "crowd");
  const portals = items.filter((item) => item.type === "portal");
  const outsideItems = items.filter((item) => {
    if (item.type === "door" || item.type === "portal") return false;
    const points = [
      { x: item.x1, y: item.y1 },
      { x: item.x2, y: item.y2 },
    ];
    if (item.type === "obstacle" || item.type === "crowd") {
      points.push(
        { x: item.x1, y: item.y2 },
        { x: item.x2, y: item.y1 },
      );
    }
    return points.some((point) => Math.hypot(point.x, point.y) > 184);
  });
  if (outsideItems.length) errors.push("Keep walls, stair aisles, obstacles, and crowd regions inside the circular floor-plan boundary.");
  if (doors.length === 0) errors.push("Add at least one exterior door.");
  if (portals.length === 0) errors.push("Add at least one doorway between the seating bowl and hallway.");
  const doorways = items.filter((item) => item.type === "door" || item.type === "portal");
  for (let index = 0; index < doorways.length; index += 1) {
    const door = doorways[index];
    if (doorways.slice(index + 1).some((other) => door.type === other.type &&
      Math.hypot(door.x1 - other.x1, door.y1 - other.y1) < Math.max(12, (door.width + other.width) * 0.433))) {
      errors.push("Separate same-boundary doorways so their openings do not overlap.");
      break;
    }
  }
  for (const door of doorways) {
    if (doorIsBlocked(door)) {
      errors.push("A bowl-to-hall door or exterior exit is blocked by an obstacle or wall. Move the obstacle or doorway.");
      break;
    }
  }

  let source = { x: 0, y: -100 };
  if (placement.value === "region") {
    if (regions.length === 0) errors.push("Draw a crowd placement region or choose Random.");
    else {
      const region = regions[regions.length - 1];
      source = { x: (region.x1 + region.x2) / 2, y: (region.y1 + region.y2) / 2 };
      if (!inWalkableArea(source) || isBlocked(source)) errors.push("The crowd region must be inside an accessible seating or concourse area.");
    }
  }
  if (doors.length && portals.length && !errors.length && !hasReachableExit(source, doors, portals)) {
    errors.push("Approximate layout check: the crowd start area cannot reach a bowl-to-hall door and an exterior exit. Check for blocking walls or obstacles.");
  }

  validationMessage.hidden = errors.length === 0;
  validationMessage.classList.toggle("invalid", errors.length > 0);
  validationMessage.textContent = errors.join(" ");
  readiness.textContent = errors.length ? "Needs attention" : "Layout valid";
  readiness.classList.toggle("ready-pill-invalid", errors.length > 0);
  runButton.disabled = errors.length > 0;
  runButton.title = errors.length ? "Fix the layout validation errors before running." : "Run the evacuation model";
  updateFloorCaption();
  return errors.length === 0;
}

function renderPreview(point) {
  preview.replaceChildren();
  if (!drawState || drawState.tool === "door") return;
  let element;
  if (drawState.tool === "wall" || drawState.tool === "stair") {
    element = makeSvg("line", {
      x1: drawState.start.x, y1: drawState.start.y, x2: point.x, y2: point.y,
      stroke: drawState.tool === "stair" ? "#c58e36" : "#596b78",
      "stroke-width": drawState.tool === "stair" ? "9" : "5",
      "stroke-dasharray": "6 4",
    });
  } else {
    element = makeSvg("rect", {
      x: Math.min(drawState.start.x, point.x),
      y: Math.min(drawState.start.y, point.y),
      width: Math.abs(point.x - drawState.start.x),
      height: Math.abs(point.y - drawState.start.y),
      fill: drawState.tool === "crowd" ? "rgb(71 124 164 / 18%)" : "rgb(96 111 122 / 25%)",
      stroke: drawState.tool === "crowd" ? "#477ca4" : "#667783",
      "stroke-dasharray": "5 4",
    });
  }
  preview.append(element);
}

function startDrawing(point, event) {
  drawState = { tool: activeTool, start: point, current: point };
  plan.classList.add("is-drawing");
  plan.setPointerCapture(event.pointerId);
  renderPreview(point);
}

function beginMove(item, point, event) {
  selectedId = item.id;
  if (item.type === "door" || item.type === "portal") doorWidthInput.value = String(item.width);
  moveState = { id: item.id, start: point, before: copyItems(items) };
  plan.setPointerCapture(event.pointerId);
  renderItems();
}

function onPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;
  const itemElement = event.target.closest?.("[data-object-id]");
  const item = itemElement ? items.find((candidate) => candidate.id === itemElement.dataset.objectId) : null;
  const point = pointFromEvent(event);

  if (activeTool === "pan") {
    panState = { x: event.clientX, y: event.clientY, panX, panY };
    plan.classList.add("is-panning");
    plan.setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }
  if (activeTool === "delete") {
    if (item) {
      selectedId = item.id;
      deleteSelected();
    }
    return;
  }
  if (activeTool === "select") {
    if (item) beginMove(item, point, event);
    else {
      selectedId = null;
      renderItems();
    }
    return;
  }
  if (activeTool === "door" || activeTool === "portal") {
    pushItem(createDoor(point.x, point.y, activeTool));
    announce(activeTool === "portal"
      ? "Bowl-to-hallway door added. Select it to move it or edit its width."
      : "Exterior exit added on the outside edge. Select it to move it or edit its width.");
    return;
  }
  startDrawing(point, event);
  event.preventDefault();
}

function onPointerMove(event) {
  if (panState) {
    panX = panState.panX + event.clientX - panState.x;
    panY = panState.panY + event.clientY - panState.y;
    updateViewTransform();
    return;
  }
  if (moveState) {
    const point = pointFromEvent(event);
    const dx = point.x - moveState.start.x;
    const dy = point.y - moveState.start.y;
    const item = items.find((candidate) => candidate.id === moveState.id);
    if (!item) return;
    item.x1 += dx;
    item.y1 += dy;
    item.x2 += dx;
    item.y2 += dy;
    if (item.type === "door" || item.type === "portal") {
      const snapped = snapDoorPoint(item.x1, item.y1, item.type);
      item.x1 = snapped.x;
      item.y1 = snapped.y;
      item.x2 = snapped.x;
      item.y2 = snapped.y;
    }
    moveState.start = point;
    renderItems(false);
    return;
  }
  if (drawState) {
    drawState.current = pointFromEvent(event);
    renderPreview(drawState.current);
  }
}

function finishDrawing(point) {
  if (!drawState) return;
  const { tool, start } = drawState;
  const width = Math.abs(point.x - start.x);
  const height = Math.abs(point.y - start.y);
  if ((tool === "wall" || tool === "stair") && Math.hypot(point.x - start.x, point.y - start.y) >= 8) {
    pushItem({ id: `${tool}-${nextId++}`, type: tool, x1: start.x, y1: start.y, x2: point.x, y2: point.y });
  } else if (tool === "obstacle" || tool === "crowd") {
    const minSize = 12;
    const end = {
      x: width < minSize ? start.x + minSize : point.x,
      y: height < minSize ? start.y + minSize : point.y,
    };
    pushItem({ id: `${tool}-${nextId++}`, type: tool, x1: start.x, y1: start.y, x2: end.x, y2: end.y });
    if (tool === "crowd") announce("Crowd region added. The placement control is set to Draw a region.");
  }
  drawState = null;
  plan.classList.remove("is-drawing");
  preview.replaceChildren();
}

function onPointerUp(event) {
  if (drawState) finishDrawing(pointFromEvent(event));
  if (moveState) {
    const before = moveState.before;
    const changed = JSON.stringify(before) !== JSON.stringify(items);
    if (changed) saveUndo(before);
    moveState = null;
    renderItems();
  }
  if (panState) {
    panState = null;
    plan.classList.remove("is-panning");
  }
}

function updateViewTransform() {
  planWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function setZoom(nextZoom) {
  zoom = Math.max(0.7, Math.min(2.2, nextZoom));
  updateViewTransform();
}

function toggleAdvanced() {
  const fields = document.querySelector("#advanced-fields");
  const expanded = fields.hidden;
  fields.hidden = !expanded;
  document.querySelector("#advanced-toggle").setAttribute("aria-expanded", String(expanded));
}

function updateDoorWidth() {
  const width = Number(doorWidthInput.value);
  const selectedDoor = items.find((item) => item.id === selectedId && (item.type === "door" || item.type === "portal"));
  if (selectedDoor && Number.isFinite(width) && selectedDoor.width !== width) {
    const before = copyItems(items);
    selectedDoor.width = width;
    saveUndo(before);
    renderItems(false);
  }
  updateValidation();
}

function seededRandom(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildRouteGrid() {
  const step = 8;
  const cells = [];
  const byKey = new Map();
  for (let x = -176; x <= 176; x += step) {
    for (let y = -176; y <= 176; y += step) {
      const point = { x, y };
      if (!inWalkableArea(point) || isBlocked(point)) continue;
      const key = `${x},${y}`;
      const cell = { x, y, key };
      cells.push(cell);
      byKey.set(key, cell);
    }
  }
  return { step, cells, byKey };
}

function nearestCell(point, grid) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const cell of grid.cells) {
    const distance = (cell.x - point.x) ** 2 + (cell.y - point.y) ** 2;
    if (distance < nearestDistance) {
      nearest = cell;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function pointNearStairs(point) {
  return items.some((item) => item.type === "stair" &&
    distanceToSegment(point, { x: item.x1, y: item.y1 }, { x: item.x2, y: item.y2 }) < 10);
}

function findShortestRoute(start, goal, grid) {
  const source = nearestCell(start, grid);
  const target = nearestCell(goal, grid);
  if (!source || !target) return null;
  const open = new Map([[source.key, source]]);
  const cameFrom = new Map();
  const cost = new Map([[source.key, 0]]);
  const estimate = (cell) => Math.hypot(cell.x - target.x, cell.y - target.y);
  const priority = (cell) => (cost.get(cell.key) ?? Infinity) + estimate(cell);
  const offsets = [
    [-grid.step, 0], [grid.step, 0], [0, -grid.step], [0, grid.step],
    [-grid.step, -grid.step], [-grid.step, grid.step], [grid.step, -grid.step], [grid.step, grid.step],
  ];

  while (open.size) {
    let current = null;
    let currentPriority = Infinity;
    for (const cell of open.values()) {
      const value = priority(cell);
      if (value < currentPriority) {
        current = cell;
        currentPriority = value;
      }
    }
    if (!current) break;
    open.delete(current.key);
    if (current.key === target.key) {
      const route = [current];
      while (cameFrom.has(current.key)) {
        current = cameFrom.get(current.key);
        route.push(current);
      }
      return route.reverse();
    }
    for (const [dx, dy] of offsets) {
      const next = grid.byKey.get(`${current.x + dx},${current.y + dy}`);
      if (!next) continue;
      if (dx !== 0 && dy !== 0 &&
        (isBlocked({ x: current.x + dx, y: current.y }) || isBlocked({ x: current.x, y: current.y + dy }))) continue;
      const diagonal = dx !== 0 && dy !== 0;
      const middle = { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 };
      const baseDistance = diagonal ? grid.step * Math.SQRT2 : grid.step;
      const terrainCost = pointNearStairs(middle) ? baseDistance / 0.75 : baseDistance;
      const nextCost = (cost.get(current.key) ?? Infinity) + terrainCost;
      if (nextCost < (cost.get(next.key) ?? Infinity)) {
        cost.set(next.key, nextCost);
        cameFrom.set(next.key, current);
        open.set(next.key, next);
      }
    }
  }
  return null;
}

function createPeople(random) {
  const count = Number(peopleInput.value);
  const crowdRegions = items.filter((item) => item.type === "crowd");
  const people = [];
  let attempts = 0;
  while (people.length < count && attempts < count * 100) {
    attempts += 1;
    let point;
    if (placement.value === "region" && crowdRegions.length) {
      const region = crowdRegions[crowdRegions.length - 1];
      point = {
        x: Math.min(region.x1, region.x2) + random() * Math.abs(region.x2 - region.x1),
        y: Math.min(region.y1, region.y2) + random() * Math.abs(region.y2 - region.y1),
      };
    } else {
      const angle = random() * Math.PI * 2;
      const radius = 58 + Math.sqrt(random()) * (174 - 58);
      point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }
    if (!inWalkableArea(point) || isBlocked(point)) continue;
    people.push({ id: people.length, x: point.x, y: point.y, routeIndex: 0, route: null, exit: null, exited: false, queueOrder: null });
  }
  return people;
}

function localCrowdDensity(person, people) {
  const radius = 16;
  let nearby = 0;
  for (const other of people) {
    if (other.exited || other.id === person.id) continue;
    if ((other.x - person.x) ** 2 + (other.y - person.y) ** 2 <= radius ** 2) nearby += 1;
  }
  return nearby / (Math.PI * radius * radius);
}

function assignRoutes(people, grid) {
  const doors = items.filter((item) => item.type === "door");
  for (const person of people) {
    let bestRoute = null;
    let bestExit = null;
    let bestLength = Infinity;
    for (const door of doors) {
      const angle = Math.atan2(door.y1, door.x1);
      const goal = { x: Math.cos(angle) * 168, y: Math.sin(angle) * 168 };
      const route = findShortestRoute(person, goal, grid);
      if (!route) continue;
      let length = 0;
      let previous = person;
      for (const cell of route) {
        length += Math.hypot(cell.x - previous.x, cell.y - previous.y);
        previous = cell;
      }
      if (length < bestLength) {
        bestLength = length;
        bestRoute = route;
        bestExit = door;
      }
    }
    if (!bestRoute) return false;
    person.route = bestRoute;
    person.routeIndex = 0;
    person.exit = bestExit;
  }
  return true;
}

function runEvacuationModel() {
  if (!updateValidation()) return null;
  const random = seededRandom(Number(document.querySelector("#seed").value));
  const grid = buildRouteGrid();
  const people = createPeople(random);
  if (people.length !== Number(peopleInput.value) || !assignRoutes(people, grid)) {
    validationMessage.hidden = false;
    validationMessage.classList.add("invalid");
    validationMessage.textContent = "The model could not place every person or assign a reachable exterior exit.";
    readiness.textContent = "Needs attention";
    readiness.classList.add("ready-pill-invalid");
    return null;
  }

  const baseSpeed = Number(speedInput.value);
  const dt = 0.25;
  const maxTime = 3600;
  const exitUsage = new Map(items.filter((item) => item.type === "door").map((door) => [door.id, 0]));
  let elapsed = 0;
  let evacuated = 0;
  let largestQueue = 0;
  const fiftyCount = Math.ceil(people.length * 0.5);
  const ninetyCount = Math.ceil(people.length * 0.9);
  let fiftyTime = null;
  let ninetyTime = null;
  const queues = new Map(items.filter((item) => item.type === "door").map((door) => [door.id, []]));
  const doorBudget = new Map(items.filter((item) => item.type === "door").map((door) => [door.id, 0]));
  let exitOrder = 0;
  const remainingHistory = [{ time: 0, remaining: people.length }];
  const animationFrames = [{
    time: 0,
    people: people.map((person) => ({ x: person.x, y: person.y, exited: false })),
  }];
  let lastFrameTime = 0;

  while (elapsed < maxTime && evacuated < people.length) {
    for (const door of items.filter((item) => item.type === "door")) {
      const queue = queues.get(door.id);
      const nextBudget = (doorBudget.get(door.id) ?? 0) + (24 * door.width / 60) * dt;
      let availableCrossings = Math.floor(nextBudget);
      let remainingBudget = nextBudget - availableCrossings;
      while (availableCrossings > 0 && queue.length) {
        const person = queue.shift();
        person.exited = true;
        evacuated += 1;
        availableCrossings -= 1;
        exitUsage.set(door.id, (exitUsage.get(door.id) ?? 0) + 1);
      }
      remainingBudget = nextBudget - (Math.floor(nextBudget) - availableCrossings);
      doorBudget.set(door.id, remainingBudget);
    }

    for (const person of people) {
      if (person.exited) continue;
      const angle = Math.atan2(person.exit.y1, person.exit.x1);
      const boundaryPoint = { x: Math.cos(angle) * 184, y: Math.sin(angle) * 184 };
      if (Math.hypot(person.x - boundaryPoint.x, person.y - boundaryPoint.y) <= 4) {
        const queue = queues.get(person.exit.id);
        if (!queue.includes(person)) {
          person.queueOrder = ++exitOrder;
          queue.push(person);
        }
        continue;
      }

      while (person.routeIndex < person.route.length &&
        Math.hypot(person.route[person.routeIndex].x - person.x, person.route[person.routeIndex].y - person.y) < 2) {
        person.routeIndex += 1;
      }
      let target;
      if (person.routeIndex < person.route.length) {
        target = person.route[person.routeIndex];
      } else {
        target = boundaryPoint;
      }

      const dx = target.x - person.x;
      const dy = target.y - person.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001) continue;

      const density = localCrowdDensity(person, people);
      const densityLimit = 0.2;
      const crowdFactor = Math.max(0, 1 - density / densityLimit);
      const speed = baseSpeed * crowdFactor * (pointNearStairs(person) ? 0.75 : 1);
      if (speed <= 0.001) continue;

      const nextX = person.x + (dx / distance) * Math.min(speed * dt, distance);
      const nextY = person.y + (dy / distance) * Math.min(speed * dt, distance);
      const blockedByPerson = people.some((other) => !other.exited && other.id !== person.id &&
        (other.x - nextX) ** 2 + (other.y - nextY) ** 2 < 0.1 ** 2);
      if (!blockedByPerson) {
        person.x = nextX;
        person.y = nextY;
      }
    }

    if (fiftyTime === null && evacuated >= fiftyCount) fiftyTime = elapsed + dt;
    if (ninetyTime === null && evacuated >= ninetyCount) ninetyTime = elapsed + dt;
    elapsed += dt;
    if (elapsed - lastFrameTime >= 1) {
      remainingHistory.push({ time: elapsed, remaining: people.length - evacuated });
      animationFrames.push({
        time: elapsed,
        people: people.map((person) => ({ x: person.x, y: person.y, exited: person.exited })),
      });
      lastFrameTime = elapsed;
    }
    for (const queue of queues.values()) largestQueue = Math.max(largestQueue, queue.length);
  }

  const largestExit = [...exitUsage.entries()].sort((a, b) => b[1] - a[1])[0];
  remainingHistory.push({ time: evacuated === people.length ? elapsed : maxTime, remaining: people.length - evacuated });
  animationFrames.push({
    time: evacuated === people.length ? elapsed : maxTime,
    people: people.map((person) => ({ x: person.x, y: person.y, exited: person.exited })),
  });
  const result = {
    elapsed: evacuated === people.length ? elapsed : maxTime,
    evacuated,
    fiftyTime,
    ninetyTime,
    exitUsage: Object.fromEntries(exitUsage),
    largestQueue,
    largestExit: largestExit ? largestExit[0] : null,
    timedOut: evacuated !== people.length,
    remainingHistory,
    animationFrames,
    totalPeople: people.length,
  };
  readiness.textContent = result.timedOut ? "Model incomplete" : "Evacuation complete";
  readiness.classList.toggle("ready-pill-invalid", result.timedOut);
  return result;
}

function renderPeopleFrame(frame) {
  if (!frame) return;
  const visible = frame.people.filter((person) => !person.exited);
  const dots = document.createDocumentFragment();
  for (const person of visible) {
    dots.append(makeSvg("circle", {
      class: "person-dot",
      cx: person.x,
      cy: person.y,
      r: "1.8",
    }));
  }
  peopleLayer.replaceChildren(dots);
}

function stopAnimation() {
  if (animationTimer !== null) {
    window.clearInterval(animationTimer);
    animationTimer = null;
  }
}

function renderChart(result) {
  const chartSvg = document.querySelector("#chart-svg");
  const chartMessage = document.querySelector("#chart-message");
  chartSvg.replaceChildren();
  chartMessage.hidden = true;

  const width = 400;
  const height = 130;
  const maxTime = Math.max(1, result.elapsed);
  const points = result.remainingHistory.map((sample) =>
    `${(sample.time / maxTime) * width},${height - (sample.remaining / result.totalPeople) * height}`
  ).join(" ");
  chartSvg.append(makeSvg("polyline", {
    class: "chart-line",
    points,
  }));

  for (const [label, time] of [["50%", result.fiftyTime], ["90%", result.ninetyTime]]) {
    if (time === null) continue;
    const remaining = result.remainingHistory.find((sample) => sample.time >= time)?.remaining;
    if (remaining === undefined) continue;
    chartSvg.append(makeSvg("circle", {
      class: "chart-milestone",
      cx: (time / maxTime) * width,
      cy: height - (remaining / result.totalPeople) * height,
      r: "4",
      "aria-label": `${label} at ${(time / 60).toFixed(2)} minutes`,
    }));
  }

  document.querySelector("#chart-max").textContent = String(result.totalPeople);
  document.querySelector("#chart-mid").textContent = String(Math.round(result.totalPeople / 2));
  document.querySelector("#chart-end").textContent = result.timedOut ? "—" : `${(result.elapsed / 60).toFixed(1)} min`;
}

function startAnimation(result) {
  stopAnimation();
  replayButton.disabled = result.timedOut || result.animationFrames.length === 0;
  currentAnimation = result;
  const frames = result.animationFrames;
  const realDuration = result.elapsed * 1000;
  const speed = Number(animationSpeed.value);
  const duration = realDuration / speed;
  const frameInterval = 50;
  const start = performance.now();
  document.querySelector(".action-hint").textContent = "Running";
  readiness.textContent = "Running";
  readiness.classList.remove("ready-pill-invalid");
  readiness.classList.add("running-pill");

  function update() {
    const progress = Math.min(1, (performance.now() - start) / duration);
    const targetTime = progress * result.elapsed;
    let frame = frames[0];
    for (const candidate of frames) {
      if (candidate.time > targetTime) break;
      frame = candidate;
    }
    renderPeopleFrame(frame);
    const evacuated = frame ? frame.people.filter((person) => person.exited).length : 0;
    const countText = document.querySelector(".results-top .panel-subtitle");
    countText.textContent = `${evacuated} / ${result.totalPeople} people out`;
    document.querySelector(".result-detail strong").textContent = `${targetTime.toFixed(0)} s`;

    if (progress >= 1) {
      stopAnimation();
      renderPeopleFrame(frames[frames.length - 1]);
      document.querySelector(".action-hint").textContent = "Complete";
      readiness.textContent = "Evacuation complete";
      document.querySelector(".results-top .panel-subtitle").textContent = `${result.totalPeople - result.evacuated} / ${result.totalPeople} people out`;
    }
  }

  update();
  animationTimer = window.setInterval(update, frameInterval);
}

function resetPlan() {
  stopAnimation();
  peopleLayer.replaceChildren();
  replayButton.disabled = true;
  currentAnimation = null;
  document.querySelector(".action-hint").textContent = "Ready";
  document.querySelector(".results-top .panel-subtitle").textContent = "— / — people out";
  for (const value of document.querySelectorAll(".metric-value")) value.firstChild.textContent = "—";
  const resultDetail = document.querySelector(".result-detail");
  if (resultDetail) {
    for (const strong of resultDetail.querySelectorAll("strong")) strong.textContent = "—";
  }
  document.querySelector("#chart-svg").replaceChildren();
  document.querySelector("#chart-message").hidden = false;
  document.querySelector("#chart-end").textContent = "—";
  document.querySelector("#chart-max").textContent = "500";
  document.querySelector("#chart-mid").textContent = "250";
  items = copyItems(initialItems);
  selectedId = null;
  drawState = null;
  moveState = null;
  panState = null;
  undoStack = [];
  redoStack = [];
  nextId = 2;
  snapEnabled = true;
  document.querySelector("#snap-tool").setAttribute("aria-pressed", "true");
  for (const [id, value] of Object.entries({
    people: "500",
    speed: "4",
    placement: "random",
    "door-width": "6",
    "plan-width": "425",
    "plan-length": "425",
    seed: "1",
    "animation-speed": "1",
  })) document.querySelector(`#${id}`).value = value;
  peopleSlider.value = "500";
  speedSlider.value = "4";
  document.querySelector("#advanced-fields").hidden = true;
  document.querySelector("#advanced-toggle").setAttribute("aria-expanded", "false");
  animationSpeedValue.textContent = "1×";
  preview.replaceChildren();
  panX = 0;
  panY = 0;
  zoom = 1;
  updateViewTransform();
  setTool("select");
  renderItems();
  announce("Floor plan reset to four bowl-to-hall doors and three 6 ft exterior exits. Inputs reset to the default MSG scenario.");
}

for (const button of svgButtons) {
  button.addEventListener("click", () => setTool(button.dataset.tool));
}

document.querySelector("#delete-tool").addEventListener("click", () => setTool("delete"));
undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);
document.querySelector("#zoom-in").addEventListener("click", () => setZoom(zoom + 0.2));
document.querySelector("#zoom-out").addEventListener("click", () => setZoom(zoom - 0.2));
document.querySelector("#fit-view").addEventListener("click", () => {
  zoom = 1;
  panX = 0;
  panY = 0;
  updateViewTransform();
});
document.querySelector("#snap-tool").addEventListener("click", (event) => {
  snapEnabled = !snapEnabled;
  event.currentTarget.setAttribute("aria-pressed", String(snapEnabled));
  announce(`Grid snapping ${snapEnabled ? "on" : "off"}.`);
});
document.querySelector("#advanced-toggle").addEventListener("click", toggleAdvanced);
document.querySelector("#reset-button").addEventListener("click", resetPlan);
replayButton.addEventListener("click", () => {
  if (currentAnimation) startAnimation(currentAnimation);
});
function maxTimeLabel(seconds) {
  return `${Math.round(seconds)} s`;
}

document.querySelector("#run-button").addEventListener("click", (event) => {
  event.preventDefault();
  const result = runEvacuationModel();
  if (!result) return;
  const totalMinutes = result.elapsed / 60;
  const metricValues = [...document.querySelectorAll(".metric-value")];
  if (metricValues[0]) metricValues[0].firstChild.textContent = result.timedOut ? "—" : totalMinutes.toFixed(2);
  if (metricValues[1]) metricValues[1].firstChild.textContent = result.fiftyTime === null ? "—" : (result.fiftyTime / 60).toFixed(2);
  if (metricValues[2]) metricValues[2].firstChild.textContent = result.ninetyTime === null ? "—" : (result.ninetyTime / 60).toFixed(2);
  const resultDetail = document.querySelector(".result-detail");
  if (resultDetail) {
    const strongs = resultDetail.querySelectorAll("strong");
    strongs[0].textContent = result.timedOut ? "Incomplete" : `${result.elapsed.toFixed(0)} s`;
    strongs[1].textContent = [...Object.entries(result.exitUsage)].map(([id, count]) => `${count}`).join(" / ");
    strongs[2].textContent = `${result.largestQueue} people`;
  }
  document.querySelector("#editor-help").textContent = result.timedOut
    ? `Model timed out after ${maxTimeLabel(result.elapsed)}; ${result.evacuated} of ${peopleInput.value} people crossed an exterior exit.`
    : `Model complete: ${result.evacuated} people evacuated in ${totalMinutes.toFixed(2)} min. Largest queue: ${result.largestQueue}.`;
  renderChart(result);
  if (!result.timedOut) startAnimation(result);
});
document.querySelector("#placement").addEventListener("change", () => {
  if (placement.value === "region") {
    setTool("crowd");
    announce("Draw a crowd placement region on the floor plan.");
  }
  updateValidation();
});
doorWidthInput.addEventListener("input", updateValidation);
doorWidthInput.addEventListener("change", updateDoorWidth);
animationSpeed.addEventListener("input", () => {
  animationSpeedValue.textContent = `${animationSpeed.value}×`;
});
for (const input of numberInputs) {
  if (input === doorWidthInput) continue;
  input.addEventListener("input", updateValidation);
  input.addEventListener("change", updateValidation);
}
peopleSlider.addEventListener("input", () => {
  peopleInput.value = peopleSlider.value;
  updateValidation();
});
speedSlider.addEventListener("input", () => {
  speedInput.value = speedSlider.value;
  updateValidation();
});

plan.addEventListener("pointerdown", onPointerDown);
plan.addEventListener("pointermove", onPointerMove);
plan.addEventListener("pointerup", onPointerUp);
plan.addEventListener("pointercancel", onPointerUp);
document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
    event.preventDefault();
    deleteSelected();
  } else if (event.key === "Escape") {
    selectedId = null;
    setTool("select");
    renderItems();
  }
});

renderItems();
