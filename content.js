// Sửa lại phần đầu file content.js
let isActive = false;
let originalContents = new Map();
let originalImages = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isActive = !isActive;
    // Thông báo cho background.js để đổi icon
    chrome.runtime.sendMessage({ action: "updateIcon", isActive });
    
    // Xử lý editMode
    document.body.classList.toggle('edit-mode', isActive);
    toggleEditMode();
  }
});


// Thêm function để xóa nút download
function removeDownloadButton(element) {
  const wrapper = element.querySelector('.download-button-wrapper');
  if (wrapper) {
    wrapper.remove();
  }
}


function addGlobalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .download-button-wrapper {
      position: absolute !important;
      top: 5px !important;  /* Giảm khoảng cách từ top */
      right: 5px !important;  /* Giảm khoảng cách từ right */
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 2147483646 !important;
      pointer-events: all !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      outline: none !important;
      user-select: none !important;
      display: flex !important;
      gap: 3px !important;  /* Giảm khoảng cách giữa các nút */
    }

    *:hover > .download-button-wrapper {
      opacity: 1;
    }

    .section-download-button,
    .section-copy-button {
      padding: 4px !important;  /* Giảm padding */
      background: white !important;
      border: none !important;
      border-radius: 50% !important;
      cursor: pointer !important;
      font-size: 12px !important;  /* Giảm font size */
      width: 24px !important;  /* Giảm width */
      height: 24px !important;  /* Giảm height */
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;  /* Giảm shadow */
      z-index: 2147483647 !important;
      pointer-events: all !important;
      position: relative !important;
      outline: none !important;
      user-select: none !important;
      opacity: 0.8 !important;  /* Thêm độ trong suốt mặc định */
    }

    .section-download-button:hover,
    .section-copy-button:hover {
      opacity: 1 !important;
      transform: scale(1.1) !important;
      transition: all 0.2s !important;
    }

    .section-download-button:hover {
      background: #4CAF50 !important;
      color: white !important;
    }

    .section-copy-button:hover {
      background: #2196F3 !important;
      color: white !important;
    }

    /* Styles khác giữ nguyên */
    .success-toast {
      position: fixed !important;
      bottom: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: #4CAF50 !important;
      color: white !important;
      padding: 10px 20px !important;
      border-radius: 4px !important;
      z-index: 2147483647 !important;
      animation: fadeOut 3s forwards !important;
      font-size: 14px !important;  /* Giảm font size của toast */
    }

    .loading-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.5) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 2147483647 !important;
      color: white !important;
      font-size: 16px !important;  /* Giảm font size của loading */
    }

    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
function showSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// Thêm styles khi script được load
addGlobalStyles();

function toggleEditMode() {

   // Xử lý sections và elements lớn
  const sections = document.querySelectorAll('section, div, article, main, aside, header, footer');
  sections.forEach(section => {
    // Bỏ qua các elements của extension
    if (section.classList.contains('download-button-wrapper') ||
        section.classList.contains('section-download-button') ||
        section.closest('.download-button-wrapper')) {
      return;
    }

    const rect = section.getBoundingClientRect();
    if (rect.width > 60 && rect.height > 30 && 
        !section.classList.contains('editor-dialog') && 
        !section.classList.contains('image-overlay') && 
        !section.classList.contains('bg-controls')) {
      if (isActive) {
        addDownloadButton(section);
      } else {
        removeDownloadButton(section);
      }
    }
  });


  // Xử lý text elements
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div:not(.editor-dialog):not(.image-overlay):not(.bg-controls)');
  textElements.forEach(element => {
    if (isActive) {
      if (!element.hasAttribute('contenteditable')) {
        originalContents.set(element, element.innerHTML);
        element.contentEditable = true;
        element.classList.add('editable-element');
      }
    } else {
      if (element.hasAttribute('contenteditable')) {
        element.contentEditable = false;
        element.classList.remove('editable-element');
      }
    }
  });

  // Xử lý images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (isActive) {
      if (!img.hasAttribute('data-editable')) {
        originalImages.set(img, img.src);
        makeImageEditable(img);
      }
    } else {
      if (img.hasAttribute('data-editable')) {
        removeImageEditable(img);
      }
    }
  });

  // Xử lý backgrounds
  const elementsWithBg = document.querySelectorAll('*');
  elementsWithBg.forEach(element => {
    const bgImage = window.getComputedStyle(element).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      if (isActive) {
        if (!element.hasAttribute('data-bg-editable')) {
          makeBackgroundEditable(element);
        }
      } else {
        if (element.hasAttribute('data-bg-editable')) {
          removeBackgroundEditable(element);
        }
      }
    }
  });
}

// Sửa lại hàm makeImageEditable
function makeImageEditable(img) {
  const container = document.createElement('div');
  container.className = 'image-edit-container';
  img.parentNode.insertBefore(container, img);
  container.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';
  
  const editButton = document.createElement('button');
  editButton.className = 'image-edit-button';
  editButton.innerHTML = '🖼️';
  editButton.title = 'Đổi hình';
  editButton.onclick = () => createImageEditor(img);
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'image-delete-button';
  deleteButton.innerHTML = '🗑️';
  deleteButton.title = 'Xóa';
  deleteButton.onclick = () => {
    if (confirm('Bạn có chắc muốn xóa hình này?')) {
      container.remove();
    }
  };
  
  const revertButton = document.createElement('button');
  revertButton.className = 'image-revert-button';
  revertButton.innerHTML = '↺';
  revertButton.title = 'Hoàn tác';
  revertButton.onclick = () => {
    img.src = originalImages.get(img);
  };

  overlay.appendChild(editButton);
  overlay.appendChild(deleteButton);
  overlay.appendChild(revertButton);
  container.appendChild(overlay);
  img.setAttribute('data-editable', 'true');
}


function makeBackgroundEditable(element) {
  const rect = element.getBoundingClientRect();
  
  const originalBg = {
    image: window.getComputedStyle(element).backgroundImage,
    size: window.getComputedStyle(element).backgroundSize,
    position: window.getComputedStyle(element).backgroundPosition,
    repeat: window.getComputedStyle(element).backgroundRepeat
  };
  element.setAttribute('data-original-bg', JSON.stringify(originalBg));

  // Luôn thêm nút download cho element đủ lớn
  if (rect.width > 100 && rect.height > 100) {
    addDownloadButton(element);
  }

  // Xử lý element nhỏ
  if (rect.height <= 18 || rect.width <= 18) {
    element.onclick = (e) => {
      if (isActive) {
        createBackgroundEditor(element);
      }
    };
    element.setAttribute('data-bg-editable', 'true');
    return;
  }

  // Xử lý element có background
  const controls = document.createElement('div');
  controls.className = 'bg-controls';

  const bgEditButton = document.createElement('button');
  bgEditButton.className = 'bg-edit-button';
  bgEditButton.innerHTML = '🎨';
  bgEditButton.title = 'Chỉnh sửa background';
  bgEditButton.onclick = (e) => {
    e.stopPropagation();
    createBackgroundEditor(element);
  };

  const deleteButton = document.createElement('button');
  deleteButton.className = 'bg-delete-button';
  deleteButton.innerHTML = '🗑️';
  deleteButton.title = 'Xóa section';
  deleteButton.onclick = (e) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa section này?')) {
      element.remove();
    }
  };

  controls.appendChild(bgEditButton);
  controls.appendChild(deleteButton);
  
  element.style.position = element.style.position || 'relative';
  element.appendChild(controls);
  element.setAttribute('data-bg-editable', 'true');
}


async function downloadSection(element) {
  try {
    // Tạo overlay loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '⌛ Đang xử lý...';
    document.body.appendChild(loadingOverlay);

    // Clone element và chuẩn bị để chụp
    const clone = element.cloneNode(true);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = element.offsetWidth + 'px';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Xóa các controls trên clone
    clone.querySelectorAll('.image-overlay, .bg-controls, .download-button-wrapper').forEach(el => el.remove());

    // Chụp ảnh section
    const canvas = await html2canvas(clone, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: 2, // Tăng chất lượng ảnh
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight
    });

    // Download ảnh
    const link = document.createElement('a');
    link.download = 'section-' + new Date().getTime() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Dọn dẹp
    container.remove();
    loadingOverlay.remove();
  } catch (error) {
    console.error('Download error:', error);
    showError('Không thể tải section: ' + error.message);
  }
}

function addDownloadButton(element) {
  if (element.querySelector('.download-button-wrapper')) {
    return;
  }

  // Đảm bảo element có position relative
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'download-button-wrapper';
  
  const downloadButton = document.createElement('button');
  downloadButton.className = 'section-download-button';
  downloadButton.innerHTML = '⬇️';
  downloadButton.title = 'Tải section này';
  
  const copyButton = document.createElement('button');
  copyButton.className = 'section-copy-button';
  copyButton.innerHTML = '📋';
  copyButton.title = 'Copy vào clipboard';

  // Xử lý sự kiện cho các nút
  downloadButton.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    downloadSection(element);
  });

  copyButton.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    copyToClipboard(element);
  });

  // Ngăn chặn sự kiện lan truyền
  [wrapper, downloadButton, copyButton].forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      e.preventDefault();
      element.style.pointerEvents = 'none';
    });

    el.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      e.preventDefault();
      element.style.pointerEvents = 'auto';
    });
  });

  wrapper.appendChild(downloadButton);
  wrapper.appendChild(copyButton);
  element.appendChild(wrapper);
}


function createImageEditor(img) {
  const originalWidth = img.width;
  const originalHeight = img.height;
  
  const dialog = createDialog();
  
  const input = document.createElement('input');
  input.type = 'url';
  input.className = 'editor-input';
  input.value = img.src;
  input.placeholder = 'Nhập URL hình ảnh';

  const actions = createDialogActions(
    () => {
      if (input.value.trim()) {
        const tempImg = new Image();
        tempImg.onload = function() {
          img.style.width = originalWidth + 'px';
          img.style.height = originalHeight + 'px';
          img.src = input.value.trim();
          img.style.objectFit = 'contain';
          dialog.remove();
        };
        tempImg.onerror = () => showError('URL hình ảnh không hợp lệ');
        tempImg.src = input.value.trim();
      }
    },
    () => dialog.remove()
  );

  dialog.appendChild(input);
  dialog.appendChild(actions);
  document.body.appendChild(dialog);
  input.focus();
}

function createBackgroundEditor(element) {
  const dialog = createDialog();
  
  const input = document.createElement('input');
  input.type = 'url';
  input.className = 'editor-input';
  input.value = window.getComputedStyle(element).backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
  input.placeholder = 'Nhập URL hình nền';

  const controls = document.createElement('div');
  controls.className = 'bg-controls';

  const sizeSelect = createSelect({
    'cover': '↕️ Cover',
    'contain': '⬚ Contain',
    '100% 100%': '⬛ Stretch',
    'auto': '⚡ Auto'
  }, window.getComputedStyle(element).backgroundSize);

  const repeatSelect = createSelect({
    'no-repeat': '1️⃣ No Repeat',
    'repeat': '🔁 Repeat',
    'repeat-x': '↔️ Repeat X',
    'repeat-y': '↕️ Repeat Y'
  }, window.getComputedStyle(element).backgroundRepeat);

  controls.appendChild(sizeSelect);
  controls.appendChild(repeatSelect);

  const actions = createDialogActions(
    () => {
      if (input.value.trim()) {
        const tempImg = new Image();
        tempImg.onload = function() {
          element.style.backgroundImage = `url('${input.value.trim()}')`;
          element.style.backgroundSize = sizeSelect.value;
          element.style.backgroundRepeat = repeatSelect.value;
          dialog.remove();
        };
        tempImg.onerror = () => showError('URL hình nền không hợp lệ');
        tempImg.src = input.value.trim();
      }
    },
    () => {
      const originalBg = JSON.parse(element.getAttribute('data-original-bg'));
      Object.assign(element.style, {
        backgroundImage: originalBg.image,
        backgroundSize: originalBg.size,
        backgroundPosition: originalBg.position,
        backgroundRepeat: originalBg.repeat
      });
      dialog.remove();
    },
    () => dialog.remove()
  );

  dialog.appendChild(input);
  dialog.appendChild(controls);
  dialog.appendChild(actions);
  document.body.appendChild(dialog);
  input.focus();
}

// Helper functions
function createDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'editor-dialog';
  return dialog;
}

function createSelect(options, defaultValue) {
  const select = document.createElement('select');
  select.className = 'editor-select';
  Object.entries(options).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.innerHTML = label;
    select.appendChild(option);
  });
  select.value = defaultValue;
  return select;
}

function createDialogActions(onSave, onRevert, onCancel = null) {
  const actions = document.createElement('div');
  actions.className = 'dialog-actions';

  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '✅';
  saveBtn.title = 'Lưu';
  saveBtn.onclick = onSave;

  const revertBtn = document.createElement('button');
  revertBtn.innerHTML = '↺';
  revertBtn.title = 'Hoàn tác';
  revertBtn.onclick = onRevert;

  actions.appendChild(saveBtn);
  actions.appendChild(revertBtn);

  if (onCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '❌';
    cancelBtn.title = 'Hủy';
    cancelBtn.onclick = onCancel;
    actions.appendChild(cancelBtn);
  }

  return actions;
}

function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function removeImageEditable(img) {
  const container = img.closest('.image-edit-container');
  if (container) {
    container.parentNode.insertBefore(img, container);
    container.remove();
  }
  img.removeAttribute('data-editable');
}

function removeBackgroundEditable(element) {
  const bgEditButton = element.querySelector('.bg-edit-button');
  if (bgEditButton) {
    bgEditButton.remove();
  }
  element.removeAttribute('data-bg-editable');
  element.onclick = null;
}

async function copyToClipboard(element) {
  try {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '⌛ Đang copy...';
    document.body.appendChild(loadingOverlay);

    // Clone và chuẩn bị element để chụp
    const clone = element.cloneNode(true);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = element.offsetWidth + 'px';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Xóa các controls trên clone
    clone.querySelectorAll('.image-overlay, .bg-controls, .download-button-wrapper').forEach(el => el.remove());

    // Chụp ảnh section
    const canvas = await html2canvas(clone, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: 2,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight
    });

    // Convert canvas sang blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });

    // Copy vào clipboard
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      showSuccess('Đã copy vào clipboard!');
    } catch (err) {
      showError('Không thể copy: ' + err.message);
    }

    // Dọn dẹp
    container.remove();
    loadingOverlay.remove();
  } catch (error) {
    console.error('Copy error:', error);
    showError('Không thể copy: ' + error.message);
  }
}