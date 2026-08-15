class Controls {
    constructor() {
        this.input = { left: false, right: false, acc: false, brk: false };
        this.createButtons();
        this.setupKeyboard();
    }

    createButtons() {
        const container = document.createElement('div');
        container.id = 'mobile-controls';
        
        // Helper to create a button
        const createBtn = (id, text, inputKey) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.textContent = text;
            btn.className = 'control-btn';
            
            // Touch events
            const press = (e) => { e.preventDefault(); this.input[inputKey] = true; btn.classList.add('active'); };
            const release = (e) => { e.preventDefault(); this.input[inputKey] = false; btn.classList.remove('active'); };
            
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
            
            container.appendChild(btn);
            return btn;
        };

        // Layout: Left/Right on bottom corners, Acc/Brk on bottom right stacked
        createBtn('btn-left', '◀', 'left').style.cssText = 'position: absolute; bottom: 30px; left: 30px;';
        createBtn('btn-right', '▶', 'right').style.cssText = 'position: absolute; bottom: 30px; left: 140px;';
        createBtn('btn-brk', 'BRK', 'brk').style.cssText = 'position: absolute; bottom: 30px; right: 140px;';
        createBtn('btn-acc', 'ACC', 'acc').style.cssText = 'position: absolute; bottom: 30px; right: 30px;';

        document.body.appendChild(container);
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.acc = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') this.input.brk = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.acc = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') this.input.brk = false;
        });
    }
}
