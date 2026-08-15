class Controls {
    constructor() {
        this.input = { left: false, right: false, acc: false, brk: false };
        this.setupButtons();
        this.setupKeyboard();
    }

    setupButtons() {
        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            const press = (e) => { 
                if(e) e.preventDefault(); 
                this.input[key] = true; 
                btn.classList.add('active'); 
            };
            const release = (e) => { 
                if(e) e.preventDefault(); 
                this.input[key] = false; 
                btn.classList.remove('active'); 
            };
            
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        };

        bindBtn('btn-left', 'left');
        bindBtn('btn-right', 'right');
        bindBtn('btn-acc', 'acc');
        bindBtn('btn-brk', 'brk');
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.input.left = true; document.getElementById('btn-left')?.classList.add('active'); }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.input.right = true; document.getElementById('btn-right')?.classList.add('active'); }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.input.acc = true; document.getElementById('btn-acc')?.classList.add('active'); }
            if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') { this.input.brk = true; document.getElementById('btn-brk')?.classList.add('active'); }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.input.left = false; document.getElementById('btn-left')?.classList.remove('active'); }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.input.right = false; document.getElementById('btn-right')?.classList.remove('active'); }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.input.acc = false; document.getElementById('btn-acc')?.classList.remove('active'); }
            if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') { this.input.brk = false; document.getElementById('btn-brk')?.classList.remove('active'); }
        });
    }
}
