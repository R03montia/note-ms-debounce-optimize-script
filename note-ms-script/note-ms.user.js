// ==UserScript==
// @name         Note.ms 智能防抖保存优化 v5.1
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  修复 isTrusted 保存失效 + 5秒防抖 + 删除冷却 + 循环闲置 + 无变更静默 + 兼容中英文
// @match        *://note.ms/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    const CONFIG = {
        saveDelay: 5000,               // 防抖确认间隔(ms)
        idleTimeout: 30000,            // 闲置触发间隔(ms)
        deletionCooldown: 5000,        // 删除提示最小触发间隔(ms)
        maxRetries: 5,
        retryInterval: 800,
        deletionMsgs: [
            "正在抹消……",
            "将天也斩杀。天、地、人，然后是我。",
            "正在忘却……",
            "将你抹去，也将我抹去。",
            "错别字？还是欲言又止？"
        ],
        idleMsgs: [
            "……总要回忆的，不是吗？",
            "请安心，这里只有你和我。",
            "请吩咐。",
            "待命中……",
            "呼气，吸气，呼气。",
            "无我梦中·阿鼻叫唤·支离灭裂"
        ]
    };

    let toastEl = null, saveTimer = null, idleTimer = null;
    let lastSavedContent = '', lastLength = 0;
    let isComposing = false, lastToastTime = 0;
    let lastDeletionToastTime = 0;
    let editor = null;

    // 轻量提示组件
    const showToast = (msg, duration = 2000) => {
        const now = Date.now();
        if (now - lastToastTime < 300 && toastEl && toastEl.textContent === msg) return;
        lastToastTime = now;

        if (!toastEl) {
            toastEl = document.createElement('div');
            Object.assign(toastEl.style, {
                position: 'fixed', bottom: '20px', right: '20px', padding: '10px 16px',
                background: 'rgba(30, 41, 59, 0.92)', color: '#f8fafc', fontSize: '13px',
                borderRadius: '8px', zIndex: '999999', transition: 'opacity 0.3s, transform 0.3s',
                backdropFilter: 'blur(8px)', fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transform: 'translateY(0)'
            });
            document.body.appendChild(toastEl);
        }

        toastEl.textContent = msg;
        toastEl.style.opacity = '1';
        toastEl.style.transform = 'translateY(0)';
        clearTimeout(toastEl._hideTimer);
        toastEl._hideTimer = setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateY(10px)';
        }, duration);
    };

    const getContent = (el) => el.value !== undefined ? el.value : (el.textContent || '');
    const getLength = (str) => { try { return str.length; } catch { return 0; } };

    // 循环闲置逻辑
    const showIdleAndReschedule = () => {
        const hasContent = editor && getContent(editor).trim().length > 0;
        if (!hasContent) return;
        const msg = CONFIG.idleMsgs[Math.floor(Math.random() * CONFIG.idleMsgs.length)];
        showToast(msg, 5000);
        idleTimer = setTimeout(showIdleAndReschedule, CONFIG.idleTimeout);
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(showIdleAndReschedule, CONFIG.idleTimeout);
    };

    // 触发原站保存（Ctrl+S 手动保存时尽力触发；原生 input 事件已不受阻拦，原站自行处理）
    const triggerSave = () => {
        if (!editor) return;
        try {
            editor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            editor.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            editor.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
            lastSavedContent = getContent(editor);
            lastLength = getLength(lastSavedContent);
        } catch (e) { console.warn('[Note.ms] 保存事件异常:', e); }
    };

    const init = () => {
        editor = document.querySelector('textarea, [contenteditable]');
        if (!editor) return false;

        // 初始化状态
        lastSavedContent = getContent(editor);
        lastLength = getLength(lastSavedContent);
        resetIdleTimer();

        // IME 防护
        editor.addEventListener('compositionstart', () => isComposing = true);
        editor.addEventListener('compositionend', () => {
            isComposing = false;
            handleInputLogic();
        });

        // 冒泡阶段监听——不再拦截，让原生事件自然到达原站
        editor.addEventListener('input', () => {
            if (isComposing) return;
            handleInputLogic();
        });

        // Ctrl+S 强制保存
        editor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                clearTimeout(saveTimer);
                triggerSave();
                showToast('💾 记住了喔', 2000);
            }
        });

        showToast('来了？欢迎回家。', 2500);
        return true;
    };

    // 输入处理逻辑（供 input 和 compositionend 复用）
    const handleInputLogic = () => {
        if (!editor) return;

        resetIdleTimer();
        clearTimeout(saveTimer);

        const current = getContent(editor);
        const currentLen = getLength(current);

        // 删除反馈 + 5秒冷却
        if (currentLen < lastLength) {
            const now = Date.now();
            if (now - lastDeletionToastTime >= CONFIG.deletionCooldown) {
                const msg = CONFIG.deletionMsgs[Math.floor(Math.random() * CONFIG.deletionMsgs.length)];
                showToast(msg, 3000);
                lastDeletionToastTime = now;
            }
        }

        // 内容变化时设置防抖确认定时器
        // 原站已通过可信原生事件自行保存，此处仅更新内部状态 + 提示
        if (current !== lastSavedContent) {
            saveTimer = setTimeout(() => {
                const toSave = getContent(editor);
                if (toSave !== lastSavedContent) {
                    lastSavedContent = toSave;
                    showToast('✅', 800);
                }
            }, CONFIG.saveDelay);
        }

        lastLength = currentLen;
    };

    // 渐进式加载
    let attempts = 0;
    const waitTimer = setInterval(() => {
        attempts++;
        if (init()) clearInterval(waitTimer);
        if (attempts >= CONFIG.maxRetries) clearInterval(waitTimer);
    }, CONFIG.retryInterval);
})();
