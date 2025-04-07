const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const gateSize = 40;
let gates = [];
let inputs = [];
let connections = [];

let selectedOutput = null;
let draggingConnection = false;
let mouseX = 0;
let mouseY = 0;
let gateToAdd = null;

let selectedComponent = null;
let draggingComponent = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

class SplitNode {
    constructor(x, y, source) {
        this.x = x;
        this.y = y;
        this.source = source; // puede ser un Input o una Gate
    }

    evaluate() {
        return this.source.evaluate();
    }

    draw() {
        ctx.save();
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}



class Input {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }

    draw() {
        ctx.save();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.value ? 'lime' : 'red';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(this.value, this.x - 5, this.y + 5);

        ctx.beginPath();
        ctx.fillStyle = 'cyan';
        ctx.arc(this.x + 15, this.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(this.x - 25, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.value ? 'lime' : 'red';
        ctx.beginPath();
        ctx.arc(this.x - 25, this.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    evaluate() {
        return this.value;
    }

    toggle() {
        this.value = this.value ? 0 : 1;
    }
}

class Gate {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.inputs = [];
        this.output = null;
    }

    evaluate() {
        if (this.inputs.length === 0) {
            this.output = 0;
            return this.output;
        }

        const inputVals = this.inputs.map(i => i.evaluate());
        switch (this.type) {
            case 'AND':
                this.output = inputVals.every(v => v === 1) ? 1 : 0;
                break;
            case 'OR':
                this.output = inputVals.some(v => v === 1) ? 1 : 0;
                break;
            case 'XOR':
                this.output = inputVals.reduce((a, b) => a ^ b, 0);
                break;
            case 'NOT':
                this.output = inputVals[0] === 0 ? 1 : 0;
                break;
            case 'NAND':
                this.output = inputVals.every(v => v === 1) ? 0 : 1;
                break;
            case 'NOR':
                this.output = inputVals.some(v => v === 1) ? 0 : 1;
                break;
            case 'XNOR':
                this.output = inputVals.reduce((a, b) => a ^ b, 0) === 1 ? 0 : 1;
                break;
        }

        return this.output;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const inputRadius = 5;
        const inputOffsetX = -20;
        const outputOffsetX = 65;
        const inputCount = this.inputs.length || (this.type === 'NOT' ? 1 : 2);
    
        const gateHeight = Math.max(40, inputCount * 20);
        const inputSpacing = gateHeight / (inputCount + 1);
        const outputY = gateHeight / 2;
    
        // Entradas
        for (let i = 0; i < inputCount; i++) {
            const inputY = inputSpacing * (i + 1);
    
            // Línea
            ctx.beginPath();
            ctx.strokeStyle = '#00ffffaa';
            ctx.moveTo(inputOffsetX - 10, inputY);
            ctx.lineTo(0, inputY);
            ctx.stroke();
    
            // Círculo
            ctx.beginPath();
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff88';
            ctx.shadowBlur = 5;
            ctx.arc(inputOffsetX, inputY, inputRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    
        // Dibujo de compuerta
        ctx.save();
        ctx.translate(0, 0);
        ctx.beginPath();
    
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#2a2f45';
        ctx.shadowColor = '#00000088';
        ctx.shadowBlur = 4;
    
        switch (this.type) {
            case 'AND':
            case 'NAND':
                ctx.moveTo(0, 0);
                ctx.lineTo(30, 0);
                ctx.arc(30, gateHeight / 2, gateHeight / 2, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(0, gateHeight);
                ctx.closePath();
                break;
    
            case 'OR':
            case 'NOR':
                ctx.moveTo(0, gateHeight);
                ctx.quadraticCurveTo(10, gateHeight / 2, 0, 0);
                ctx.lineTo(20, 0);
                ctx.quadraticCurveTo(80, gateHeight / 2, 20, gateHeight);
                ctx.closePath();
                break;
    
            case 'XOR':
            case 'XNOR':
                ctx.moveTo(-10, gateHeight);
                ctx.quadraticCurveTo(0, gateHeight / 2, -10, 0);
                ctx.stroke();
    
                ctx.beginPath();
                ctx.moveTo(0, gateHeight);
                ctx.quadraticCurveTo(10, gateHeight / 2, 0, 0);
                ctx.lineTo(20, 0);
                ctx.quadraticCurveTo(80, gateHeight / 2, 20, gateHeight);
                ctx.closePath();
                break;
    
            case 'NOT':
                ctx.moveTo(0, 0);
                ctx.lineTo(40, gateHeight / 2);
                ctx.lineTo(0, gateHeight);
                ctx.closePath();
                break;
        }
    
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    
        // Círculo de negación
        if (['NOT', 'NAND', 'NOR', 'XNOR'].includes(this.type)) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.arc(outputOffsetX - 7, outputY, 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    
        // Línea de salida
        ctx.beginPath();
        ctx.strokeStyle = '#00ffffaa';
        ctx.moveTo(outputOffsetX - 2, outputY);
        ctx.lineTo(outputOffsetX + 10, outputY);
        ctx.stroke();
    
        // Etiqueta
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillText(this.type, 5, gateHeight + 16);
    
        // Valor de salida
        if (this.output !== null) {
            ctx.fillStyle = this.output === 1 ? '#2ecc71' : '#e74c3c';
            ctx.font = 'bold 18px Segoe UI';
            ctx.fillText(this.output, outputOffsetX + 15, outputY + 6);
        }
    
        // Círculo de salida
        ctx.beginPath();
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff88';
        ctx.shadowBlur = 5;
        ctx.arc(outputOffsetX, outputY, inputRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    
        ctx.restore();
    }
    

}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;

    // Dibujar conexiones (tipo "L" ortogonal)
    ctx.strokeStyle = '#888';
    for (const conn of connections) {
        const from = conn.from;
        const to = conn.to;

        const fromX = from instanceof Gate ? from.x + gateSize + 8 :
            from instanceof SplitNode ? from.x :
                from.x + 15;
        const fromY = from instanceof Gate ? from.y + gateSize / 2 :
            from instanceof SplitNode ? from.y :
                from.y;

        const idx = to.inputs.indexOf(from);
        const toX = to.x - 8;
        const toY = to.y + gateSize / 3 + (idx === 1 ? gateSize / 3 : 0);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo((fromX + toX) / 2, fromY);
        ctx.lineTo((fromX + toX) / 2, toY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
    }

    // Dibujar entradas
    for (const inp of inputs) {
        inp.draw();
    }

    // Evaluar y dibujar compuertas
    for (const gate of gates) {
        gate.evaluate();
    }

    for (const gate of gates) {
        gate.draw();
    }

    // Dibujar conexión mientras se arrastra
    if (draggingConnection && selectedOutput) {
        const from = selectedOutput.ref;
        let fromX, fromY;

        if (from instanceof Gate) {
            fromX = from.x + gateSize + 8;
            fromY = from.y + gateSize / 2;
            ctx.strokeStyle = 'yellow';
        } else if (from instanceof Input) {
            fromX = from.x + 15;
            fromY = from.y;
            ctx.strokeStyle = 'yellow';
        } else if (from instanceof SplitNode) {
            fromX = from.x;
            fromY = from.y;
            ctx.strokeStyle = 'red'; // Diferencia visual para nodos de ramificación
        }

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
    }

    // Dibujar la bombilla
    drawBulb(ctx, canvas, gates);

    // Dibujar nodos de ramificación (SplitNodes)
    for (const inp of inputs) {
        if (inp instanceof SplitNode) {
            inp.draw();
        }
    }


    if (hoveredGate && hoveredInputIndex !== -1) {
        const inX = hoveredGate.x - 8;
        const inY = hoveredInputIndex === 0
            ? hoveredGate.y + gateSize / 3
            : hoveredGate.y + (2 * gateSize) / 3;

        ctx.beginPath();
        ctx.arc(inX, inY, RANGO_CONEXION, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
        ctx.stroke();
    }

}

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Alternar entrada (interruptor)
    for (const inp of inputs) {
        if (Math.hypot(x - (inp.x - 25), y - inp.y) < 10) {
            inp.toggle();
            drawCanvas();
            return;
        }
    }

    // Iniciar conexión desde entrada
    for (const inp of inputs) {
        if (Math.hypot(x - (inp.x + 15), y - inp.y) < 6) {
            selectedOutput = { ref: inp };
            draggingConnection = true;
            return;
        }
    }

    // Iniciar conexión desde compuerta
    for (const gate of gates) {
        const outX = gate.x + gateSize + 8;
        const outY = gate.y + gateSize / 2;
        if (Math.hypot(x - outX, y - outY) < 10) {
            selectedOutput = { ref: gate };
            draggingConnection = true;
            return;
        }
    }

    // Detectar si se va a arrastrar compuerta
    for (const gate of gates) {
        if (x >= gate.x && x <= gate.x + gateSize && y >= gate.y && y <= gate.y + gateSize) {
            draggingComponent = gate;
            dragOffsetX = x - gate.x;
            dragOffsetY = y - gate.y;
            return;
        }
    }

    // Detectar si se va a arrastrar entrada
    for (const input of inputs) {
        if (Math.hypot(x - input.x, y - input.y) < 15) {
            draggingComponent = input;
            dragOffsetX = x - input.x;
            dragOffsetY = y - input.y;
            return;
        }
    }

    // 💡 Detectar si se hizo clic sobre un cable para insertar ramificación
    for (const conn of connections) {
        const from = conn.from;
        const to = conn.to;

        const fromX = from instanceof Gate ? from.x + gateSize + 8 : from.x + 15;
        const fromY = from instanceof Gate ? from.y + gateSize / 2 : from.y;

        const inputIdx = to.inputs.indexOf(from);
        if (inputIdx === -1) continue;

        const toX = to.x - 8;
        const toY = to.y + gateSize / 3 + (inputIdx === 1 ? gateSize / 3 : 0);

        const dist = pointToSegmentDistance(x, y, fromX, fromY, toX, toY);
        if (dist < 6) {
            // Crear SplitNode (ramificación)
            const split = new SplitNode(x, y, from);
            inputs.push(split);
            drawCanvas();
            return;
        }
    }


    // Iniciar conexión desde SplitNode
    for (const inp of inputs) {
        if (inp instanceof SplitNode) {
            if (Math.hypot(x - inp.x, y - inp.y) < 6) {
                selectedOutput = { ref: inp };
                draggingConnection = true;
                return;
            }
        }
    }


});

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}



canvas.addEventListener('mouseup', e => {
    if (draggingComponent) {
        draggingComponent = null;
        drawCanvas();
        return;
    }

    if (!selectedOutput) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const gate of gates) {
        const in1X = gate.x - 8;
        const in1Y = gate.y + gateSize / 3;
        const in2Y = gate.y + (2 * gateSize) / 3;

        let inputIndex = -1;

        if (Math.hypot(x - in1X, y - in1Y) < 10) {
            inputIndex = 0;
        } else if (Math.hypot(x - in1X, y - in2Y) < 10) {
            inputIndex = 1;
        }

        if (inputIndex !== -1) {
            const from = selectedOutput.ref;

            // ⚠️ Si ya hay una conexión en esa entrada, probar otra compuerta
            if (gate.inputs[inputIndex]) continue;

            const conexionesDesdeFuente = connections.filter(conn => conn.from === from);
            const yaEstaEnOtraCompuerta = conexionesDesdeFuente.some(conn => conn.to !== gate);

            let finalSource = from;

            // ⚙️ Crear SplitNode si hace falta
            if (conexionesDesdeFuente.length > 0 && yaEstaEnOtraCompuerta && !(from instanceof SplitNode)) {
                let split = inputs.find(inp => inp instanceof SplitNode && inp.original === from);

                if (!split) {
                    split = new SplitNode(from.x + 30, from.y, from);
                    inputs.push(split);

                    for (const conn of connections) {
                        if (conn.from === from) {
                            conn.from = split;
                        }
                    }
                }

                finalSource = split;
            }

            // 🚫 Evitar entradas duplicadas en la misma compuerta
            if (!gate.inputs.includes(finalSource)) {
                gate.inputs[inputIndex] = finalSource;
                connections.push({ from: finalSource, to: gate });
            }

            break;
        }
    }

    selectedOutput = null;
    draggingConnection = false;
    drawCanvas();
});



let hoveredGate = null;
let hoveredInputIndex = -1;
const RANGO_CONEXION = 20;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    hoveredGate = null;
    hoveredInputIndex = -1;

    if (draggingConnection) {
        drawCanvas();
        return;
    }

    if (draggingComponent) {
        if (draggingComponent instanceof Gate || draggingComponent instanceof Input) {
            draggingComponent.x = mouseX - dragOffsetX;
            draggingComponent.y = mouseY - dragOffsetY;
            drawCanvas();
        }
        return;
    }

    // 👉 Solo detectar hover si no estás arrastrando nada
    for (const gate of gates) {
        const in1X = gate.x - 8;
        const in1Y = gate.y + gateSize / 3;
        const in2Y = gate.y + (2 * gateSize) / 3;

        if (Math.hypot(mouseX - in1X, mouseY - in1Y) < RANGO_CONEXION) {
            hoveredGate = gate;
            hoveredInputIndex = 0;
            break;
        } else if (Math.hypot(mouseX - in1X, mouseY - in2Y) < RANGO_CONEXION) {
            hoveredGate = gate;
            hoveredInputIndex = 1;
            break;
        }
    }

    drawCanvas();
});


canvas.addEventListener('click', e => {
    if (gateToAdd) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addGate(gateToAdd, x, y);
        gateToAdd = null;
        canvas.style.cursor = 'default';
        drawCanvas();
    }
});

canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Eliminar compuerta
    for (let i = gates.length - 1; i >= 0; i--) {
        const gate = gates[i];
        if (x >= gate.x && x <= gate.x + gateSize && y >= gate.y && y <= gate.y + gateSize) {
            connections = connections.filter(conn => conn.from !== gate && conn.to !== gate);
            gates.splice(i, 1);
            drawCanvas();
            return;
        }
    }

    // Eliminar entrada
    for (let i = inputs.length - 1; i >= 0; i--) {
        const inp = inputs[i];
        if (Math.hypot(x - inp.x, y - inp.y) < 15) {
            connections = connections.filter(conn => conn.from !== inp && conn.to !== inp);
            inputs.splice(i, 1);
            drawCanvas();
            return;
        }
    }
});


function addInput(x, y, val) {
    inputs.push(new Input(x, y, val));
}

function addGate(type, x, y) {
    gates.push(new Gate(type, x, y));
}

function selectGateToAdd(type) {
    gateToAdd = type;
    canvas.style.cursor = 'crosshair';
}

function resetCanvas() {
    gates = [];
    inputs = [];
    connections = [];
    const count = parseInt(document.getElementById('inputCount').value);
    for (let i = 0; i < count; i++) {
        addInput(50, 100 + i * 80, 0);
    }
    drawCanvas();
}

document.getElementById('inputCount').addEventListener('change', resetCanvas);

resetCanvas();

function drawBulb(ctx, canvas, gates) {
    if (!gates || gates.length === 0) return;

    // Buscar la compuerta más a la derecha (mayor x)
    const rightmostGate = gates.reduce((maxGate, gate) => {
        return (!maxGate || gate.x > maxGate.x) ? gate : maxGate;
    }, null);

    if (!rightmostGate || rightmostGate.output === null) return;

    const x = canvas.width - 100;
    const y = 150;

    ctx.save();
    ctx.translate(x, y);

    // Efecto de iluminación si está encendida
    if (rightmostGate.output === 1) {
        const glow = ctx.createRadialGradient(0, -30, 10, 0, -30, 70);
        glow.addColorStop(0, 'rgba(255, 255, 180, 0.5)');
        glow.addColorStop(1, 'rgba(255, 255, 180, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -30, 70, 0, Math.PI * 2);
        ctx.fill();
    }

    // Forma redonda tipo globo
    ctx.beginPath();
    ctx.ellipse(0, -20, 35, 35, 0, 0, Math.PI * 2);
    ctx.closePath();

    const bulbGradient = ctx.createLinearGradient(0, -60, 0, 20);
    if (rightmostGate.output === 1) {
        bulbGradient.addColorStop(0, '#ffffcc');
        bulbGradient.addColorStop(1, '#ffe066');
    } else {
        bulbGradient.addColorStop(0, '#777');
        bulbGradient.addColorStop(1, '#444');
    }

    ctx.fillStyle = bulbGradient;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Reflejo de luz sutil
    ctx.beginPath();
    ctx.moveTo(-12, -35);
    ctx.bezierCurveTo(-20, -20, -10, -5, -3, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Filamento (cuando encendida)
    if (rightmostGate.output === 1) {
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-5, -10);
        ctx.lineTo(0, -5);
        ctx.lineTo(5, -10);
        ctx.lineTo(10, -5);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Casquillo
    ctx.beginPath();
    ctx.rect(-15, 15, 30, 20);
    const socketGradient = ctx.createLinearGradient(0, 15, 0, 35);
    socketGradient.addColorStop(0, '#ccc');
    socketGradient.addColorStop(1, '#888');
    ctx.fillStyle = socketGradient;
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.stroke();

    // Líneas del casquillo
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-12, 19 + i * 5);
        ctx.lineTo(12, 19 + i * 5);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.restore();
}



// Filtrar solo los Inputs reales (excluye SplitNode si está en el mismo array)
function getBaseInputs() {
    return inputs.filter(inp => inp instanceof Input);
}

// Genera todas las combinaciones binarias posibles de n bits
function generateCombinations(n) {
    const total = 2 ** n;
    const combos = [];

    for (let i = 0; i < total; i++) {
        const bin = i.toString(2).padStart(n, '0').split('').map(Number);
        combos.push(bin);
    }

    return combos;
}

// Detecta compuertas de salida (que no alimentan a otras compuertas)
function getOutputGates() {
    return gates.filter(g =>
        !gates.some(other => other.inputs.includes(g))
    );
}

// Evalúa el circuito para todas las combinaciones
function evaluateCircuit(combos, baseInputs) {
    const results = [];

    for (const combo of combos) {
        // Setea valores a cada Input
        baseInputs.forEach((inp, idx) => inp.value = combo[idx]);

        // Evalúa todas las compuertas
        gates.forEach(g => g.evaluate());

        // Obtiene salidas finales
        const outputs = getOutputGates().map(g => g.output);
        results.push([...combo, ...outputs]);
    }

    return results;
}

// Renderiza la tabla HTML
function renderTruthTable(data, baseInputs, outputCount) {
    const table = document.getElementById('truthTable');
    if (!table) return;

    const inputHeaders = baseInputs.map((_, i) => `In${i + 1}`);
    const outputHeaders = Array.from({ length: outputCount }, (_, i) => `Out${i + 1}`);
    const thead = `<tr>${[...inputHeaders, ...outputHeaders].map(h => `<th>${h}</th>`).join('')}</tr>`;

    const rows = data.map(row => {
        const cells = row.map((val, idx) => {
            // Solo coloreamos las salidas (últimos outputCount valores)
            const isOutput = idx >= row.length - outputCount;
            const cellClass = isOutput ? `highlight-${val}` : '';
            return `<td class="${cellClass}">${val}</td>`;
        });
        return `<tr>${cells.join('')}</tr>`;
    }).join('');

    table.innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;
}


// Función principal para generar todo
function generateTruthTable() {
    const baseInputs = getBaseInputs();
    const combos = generateCombinations(baseInputs.length);
    const results = evaluateCircuit(combos, baseInputs);
    const outputs = getOutputGates();
    renderTruthTable(results, baseInputs, outputs.length);
}
