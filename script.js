  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: {
      subGraphTitleMargin: { top: 20, bottom: 10 },
      useMaxWidth: false,
      htmlLabels: true,
      diagramPadding: 14
    }
  });

  /* Modal viewer */
  const docModal = document.getElementById('doc-modal');
  const docViewer = document.getElementById('doc-viewer');
  const docModalTitle = document.getElementById('doc-modal-title');
  const docModalClose = document.getElementById('doc-modal-close');
  const docLinks = document.querySelectorAll('.ref-link[data-doc]');

  function closeDocModal() {
    docModal.classList.remove('is-open');
    docModal.setAttribute('aria-hidden', 'true');
    docViewer.removeAttribute('src');
  }

  docLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const docPath = link.dataset.doc || link.getAttribute('href');
      docModalTitle.textContent = docPath;
      docViewer.src = docPath;
      docModal.classList.add('is-open');
      docModal.setAttribute('aria-hidden', 'false');
    });
  });

  docModalClose.addEventListener('click', closeDocModal);
  docModal.addEventListener('click', (event) => {
    if (event.target === docModal) closeDocModal();
  });

  /* Keyboard: 1–7 section jumps, 0 Top, Esc modal close */
  const keyMap = {
    '1':'overview', '2':'plan', '3':'implementation',
    '4':'figma', '5':'full-service', '6':'socmed',
    '7':'poc', '8':'appendix', '0':'top'
  };
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && docModal.classList.contains('is-open')) {
      closeDocModal();
      return;
    }
    const id = keyMap[event.key];
    if (id) {
      const el = document.getElementById(id);
      if (el) {
        event.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    }
  });
