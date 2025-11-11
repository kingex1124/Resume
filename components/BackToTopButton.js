// BackToTopButton - 回到頂端按鈕 (支援手機 & 視窗縮放, 平滑捲動, 正確顯示/隱藏)
// 使用方式: 在各頁面 import 並呼叫 BackToTopButton.initialize({ threshold: 60, hideDelay: 180 })
// 設計重點:
// 1. 捲動超過 threshold 顯示
// 2. 回頂後延遲 hideDelay 毫秒再隱藏 (避免瞬間捲動閃爍)
// 3. 行動裝置使用多來源捲動值 window.scrollY / documentElement / body
// 4. resize / orientationchange 期間避免誤判隱藏
// 5. 顏色與導覽列同步 (若存在 .navigation-bar)

export const BackToTopButton = {
  initialize(options = {}) {
    if (document.getElementById('back-to-top-btn')) return; // 已初始化

    // 參數
  // 顯示門檻：優先使用 px，其次使用視窗高度比例（預設 1/2）
  const usePxThreshold = typeof options.threshold === 'number';
  const thresholdRatio = typeof options.thresholdRatio === 'number' ? options.thresholdRatio : 0.5; // 0~1
  // 動態取得門檻（避免行動裝置視口高度變化造成過早顯示）
  const getThreshold = () => {
    if (usePxThreshold) return options.threshold;
    try {
      const baseEl = (scrollRoot && scrollRoot !== document.body && scrollRoot !== document.documentElement)
        ? scrollRoot
        : (document.documentElement || document.body);
      const baseH = (baseEl && baseEl.clientHeight) ? baseEl.clientHeight : (window.innerHeight || 0);
      return Math.round(baseH * thresholdRatio);
    } catch (_) {
      return Math.round((window.innerHeight || 0) * thresholdRatio);
    }
  };
    const hideDelay = typeof options.hideDelay === 'number' ? options.hideDelay : 180; // 回頂延遲隱藏(ms)
    const scrollBehavior = options.scrollBehavior === 'instant' ? 'auto' : 'smooth';
    const providedScrollContainer = options.scrollContainer || null; // 可選: 指定滾動容器 selector 或元素

    // 允許滾動 (某些情況下 overflow 可能被其他樣式蓋掉)
    document.documentElement.style.setProperty('overflow', 'visible', 'important');
    document.body.style.setProperty('overflow', 'visible', 'important');

    // 建立樣式 (不含顯示/隱藏)
    const styleEl = document.createElement('style');
    styleEl.textContent = `#back-to-top-btn{position:fixed!important;bottom:12px!important;right:12px!important;width:52px!important;height:52px!important;border-radius:50%!important;background-color:#3498db!important;color:#fff!important;border:none!important;font-size:20px!important;cursor:pointer!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;box-shadow:0 4px 12px rgba(0,0,0,0.15)!important;transition:all .28s ease!important;margin:0!important;padding:0!important;}`;
    document.head.appendChild(styleEl);

    // 建立按鈕
    const btn = document.createElement('button');
    btn.id = 'back-to-top-btn';
    btn.type = 'button';
    btn.innerHTML = options.iconHTML || '↑';
    btn.title = options.title || '回到最上方';

    // 從導覽列同步背景色
    const nav = document.querySelector('.navigation-bar');
    if (nav) {
      try {
        const navBg = getComputedStyle(nav).backgroundColor;
        if (navBg) btn.style.backgroundColor = navBg;
      } catch (err) {
        console.warn('⚠️ 無法讀取導覽列背景色:', err?.message);
      }
    }

    // 狀態
  let isVisible = false;
    let resizeActive = false;
    let lastAboveThresholdTs = 0;
    let scrollRoot = null; // 實際滾動容器 (行動裝置/自訂容器時使用)
  let clickToTopActive = false; // 點擊回頂期間

    function isScrollable(el) {
      if (!el) return false;
      const cs = getComputedStyle(el);
      const overflowY = cs.overflowY;
      const canScrollY = (overflowY === 'auto' || overflowY === 'scroll');
      const hasScroll = (el.scrollHeight - el.clientHeight) > 1;
      return canScrollY && hasScroll;
    }

    function detectScrollRoot() {
      // 若外部明確提供
      if (providedScrollContainer) {
        if (typeof providedScrollContainer === 'string') {
          const el = document.querySelector(providedScrollContainer);
          if (isScrollable(el)) return el || document.scrollingElement || document.documentElement || document.body;
        } else if (providedScrollContainer && typeof providedScrollContainer === 'object') {
          if (isScrollable(providedScrollContainer)) return providedScrollContainer;
        }
        // 若提供但不可滾動，繼續走自動偵測
      }

      // 1) 首選標準滾動根
      const std = document.scrollingElement || document.documentElement || document.body;
      if (std && (std.scrollHeight - std.clientHeight) > 1) return std;

      // 2) 常見容器
      const selectors = ['#app', '#root', '#main', '#container', '#content', 'main', '.app', '.root', '.main', '.container', '.content'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (isScrollable(el)) return el;
      }

      // 3) 掃描 body 直屬子元素，挑可滾動的一個
      for (const el of Array.from(document.body.children)) {
        if (isScrollable(el)) return el;
      }

      // 4) 最後退回 body
      return document.body;
    }

    function getScrollPos() {
      if (scrollRoot && typeof scrollRoot.scrollTop === 'number') return scrollRoot.scrollTop;
      const se = document.scrollingElement || document.documentElement || document.body;
      return (typeof window.scrollY === 'number' ? window.scrollY : 0) || se.scrollTop || 0;
    }

    function showButton() {
      if (isVisible) return;
      btn.style.setProperty('opacity', '1', 'important');
      btn.style.setProperty('visibility', 'visible', 'important');
      btn.style.setProperty('transform', 'translateY(0)', 'important');
      btn.style.setProperty('pointer-events', 'auto', 'important');
      isVisible = true;
    }

    function hideButton(force = false) {
      if (!isVisible && !force) return;
      btn.style.setProperty('opacity', '0', 'important');
      btn.style.setProperty('visibility', 'hidden', 'important');
      btn.style.setProperty('transform', 'translateY(10px)', 'important');
      btn.style.setProperty('pointer-events', 'none', 'important');
      isVisible = false;
    }

    function updateGeometry() {
      const w = window.innerWidth;
      let bottom = 12, right = 12, size = 52, fontSize = 20;
      if (w <= 480) { bottom = 6; right = 6; size = 48; fontSize = 18; }
      else if (w <= 640) { bottom = 8; right = 8; size = 48; fontSize = 18; }
      else if (w <= 900) { bottom = 10; right = 10; }
      btn.style.setProperty('position', 'fixed', 'important');
      btn.style.setProperty('bottom', bottom + 'px', 'important');
      btn.style.setProperty('right', right + 'px', 'important');
      btn.style.setProperty('width', size + 'px', 'important');
      btn.style.setProperty('height', size + 'px', 'important');
      btn.style.setProperty('font-size', fontSize + 'px', 'important');
    }

    function evaluateVisibility() {
      const threshold = getThreshold();
      const scrollPos = getScrollPos();
      const now = Date.now();
      // 頂端幾乎為 0 時立即隱藏（不再等待 hideDelay）
      if (scrollPos <= 2) {
        hideButton(true);
        return;
      }
      const above = scrollPos > threshold;
      if (above) {
        lastAboveThresholdTs = now;
        showButton();
      } else {
        // 若低於門檻但未達頂端，採用原延遲策略防止閃爍
        if (now - lastAboveThresholdTs >= hideDelay) hideButton();
      }
    }

    // 點擊：支援實際滾動容器回頂 + 多重備援（手機/自訂容器），優先平滑滾動
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clickToTopActive = true;

      // 小工具：用 rAF 製作平滑滾動（沒有原生 smooth 支援時）
      const animateToTop = (target, duration = 400) => {
        try {
          const start = (target === window || target === document || target === document.body || target === document.documentElement)
            ? (window.scrollY || (document.scrollingElement || document.documentElement || document.body).scrollTop || 0)
            : (target.scrollTop || 0);
          const startTime = performance.now();
          const ease = (t) => t<.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut
          const step = (now) => {
            const elapsed = now - startTime;
            const p = Math.min(1, elapsed / duration);
            const eased = ease(p);
            const next = Math.round(start * (1 - eased));
            try {
              if (target === window || target === document || target === document.body || target === document.documentElement) {
                window.scrollTo(0, next);
              } else {
                target.scrollTop = next;
              }
            } catch(_){}
            if (p < 1) requestAnimationFrame(step);
          };
          if (start > 2) requestAnimationFrame(step);
        } catch(_){}
      };

      try {
        // 1) 目標容器集合：scrollRoot → scrollingElement → documentElement → body
        const targets = [];
        if (scrollRoot) targets.push(scrollRoot);
        const se = document.scrollingElement || document.documentElement || document.body;
        if (se && !targets.includes(se)) targets.push(se);
        if (!targets.includes(document.documentElement)) targets.push(document.documentElement);
        if (!targets.includes(document.body)) targets.push(document.body);

        // 2) 先嘗試對每個容器執行平滑捲動（支援 element.scrollTo）
        const noNativeSmooth = new Set();
        for (const t of targets) {
          if (!t) continue;
          try {
            if (typeof t.scrollTo === 'function') {
              t.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              noNativeSmooth.add(t);
            }
          } catch (_) { noNativeSmooth.add(t); }
        }

        // 3) 呼叫 window 作為額外平滑備援
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}

        // 4) 80ms 後檢查若仍未在頂端，使用 rAF 動畫補上
        setTimeout(() => {
          if (getScrollPos() > 2) {
            // 再偵測一次滾動根（某些頁面點擊後才建立/切換容器）
            scrollRoot = detectScrollRoot();
            const againTargets = [scrollRoot];
            const againSe = document.scrollingElement || document.documentElement || document.body;
            if (againSe && !againTargets.includes(againSe)) againTargets.push(againSe);
            for (const t of againTargets) animateToTop(t);
            animateToTop(window);
          }
          // 再評估一次可見性（頂端應隱藏）
          evaluateVisibility();
        }, 80);

        // 5) 最後保底：600ms 後若仍不在頂端，使用瞬移確保到位
        setTimeout(() => {
          if (getScrollPos() > 2) {
            try { document.documentElement.scrollTop = 0; } catch (_) {}
            try { document.body.scrollTop = 0; } catch (_) {}
            try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (_) {}
          }
        }, 600);
        // 6) rAF 監看直到到頂為止再隱藏，避免最後一段沒有觸發捲動事件
        const startWatch = performance.now();
        const watch = (now) => {
          if (getScrollPos() <= 2) {
            hideButton(true);
            clickToTopActive = false;
            return;
          }
          if (now - startWatch < 1500) requestAnimationFrame(watch); else clickToTopActive = false;
        };
        requestAnimationFrame(watch);

      } catch (err) {
        console.warn('⚠️ 回頂動作遇到例外，改用強制回頂:', err?.message);
        try { document.documentElement.scrollTop = 0; } catch (_) {}
        try { document.body.scrollTop = 0; } catch (_) {}
      }

      // 視覺上不要停留太久，排程隱藏（雙保險）
      setTimeout(() => { if (getScrollPos() <= 2) hideButton(true); }, hideDelay + 40);
    });

    function onAnyScroll() {
      if (resizeActive) return; // resize階段略過
      // 任何捲動都先快速檢查是否到頂
      if (getScrollPos() <= 2) {
        hideButton(true);
        clickToTopActive = false;
        return;
      }
      if (clickToTopActive) {
        // 尚未到頂則維持顯示直到 evaluateVisibility 處理
      }
      evaluateVisibility();
    }

    window.addEventListener('scroll', onAnyScroll, { passive: true });

    // 對自訂滾動容器也監聽
    function bindScrollRootListener() {
      if (!scrollRoot) return;
      if (scrollRoot !== window && scrollRoot !== document && scrollRoot !== document.documentElement && scrollRoot !== document.body) {
        scrollRoot.addEventListener('scroll', onAnyScroll, { passive: true });
      }
    }

    window.addEventListener('resize', () => {
      resizeActive = true;
      // 門檻使用 getThreshold 動態計算，這裡不需要手動設定
      updateGeometry();
      // 重新偵測滾動根 (某些 RWD 版面在斷點時改變可滾動容器)
      scrollRoot = detectScrollRoot();
      bindScrollRootListener();
      setTimeout(() => { resizeActive = false; evaluateVisibility(); }, 250);
    });

    window.addEventListener('orientationchange', () => {
      resizeActive = true;
      setTimeout(() => { 
        // 門檻使用 getThreshold 動態計算，這裡不需要手動設定
        updateGeometry(); 
        // 旋轉後也重新偵測滾動根
        scrollRoot = detectScrollRoot();
        bindScrollRootListener();
        resizeActive = false; 
        evaluateVisibility(); 
      }, 400);
    });

    // 初始掛載
    document.documentElement.appendChild(btn);
    hideButton(true); // 保證起始為隱藏
    updateGeometry();
    // 初始化滾動根與監聽
    scrollRoot = detectScrollRoot();
    bindScrollRootListener();
    // 首次檢查 (處理重新整理時瀏覽器記住捲動位置)
    setTimeout(evaluateVisibility, 30);
    setTimeout(evaluateVisibility, 120);
    // 內容延遲載入的頁面，追加幾次檢查
    setTimeout(() => { scrollRoot = detectScrollRoot(); bindScrollRootListener(); evaluateVisibility(); }, 500);
    setTimeout(() => { scrollRoot = detectScrollRoot(); bindScrollRootListener(); evaluateVisibility(); }, 1000);
  }
};
