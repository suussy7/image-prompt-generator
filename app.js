let currentState = {
  currentImage: null,
  currentPrompt: ''
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

// Paste-from-clipboard image support
document.addEventListener('paste', function (event) {
  if (event.clipboardData && event.clipboardData.items) {
    for (let i = 0; i < event.clipboardData.items.length; i++) {
      let item = event.clipboardData.items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          loadImage(file);
          event.preventDefault();
          break;
        }
      }
    }
  }
});

// Only Replicate API for prompts
async function analyzeImageWithProxy(base64Image) {
  const apiUrl = "https://replicate-proxy-l522.vercel.app/api/blip-caption";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image })
  });
  if (!response.ok) throw new Error("Backend error");
  const data = await response.json();
  return data.caption;
}

function setupEventListeners() {
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const uploadArea = document.getElementById('uploadArea');
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', e => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', handleFileDrop);
  document.getElementById('copyBtn').addEventListener('click', copyPrompt);
  document.getElementById('clearImageBtn').addEventListener('click', clearImage);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
}

function handleFileDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) loadImage(files[0]);
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    currentState.currentImage = e.target.result;
    displayImage(e.target.result);
    startAnalysisWithAI(e.target.result);
  };
  reader.readAsDataURL(file);
}

function displayImage(imageSrc) {
  document.getElementById('uploadArea').classList.add('hidden');
  document.getElementById('imageDisplay').classList.remove('hidden');
  document.getElementById('uploadedImage').src = imageSrc;
}

function startAnalysisWithAI(imageBase64) {
  const progressElement = document.getElementById('analysisProgress');
  const completeElement = document.getElementById('analysisComplete');
  const progressFill = document.querySelector('.progress-fill');
  progressElement.classList.remove('hidden');
  completeElement.classList.add('hidden');
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 95) progress = 95;
    progressFill.style.width = progress + '%';
  }, 150);

  analyzeImageWithProxy(imageBase64).then(caption => {
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    setTimeout(() => {
      progressElement.classList.add('hidden');
      completeElement.classList.remove('hidden');
      currentState.currentPrompt = caption;
      updatePromptDisplay();
    }, 600);
  }).catch(() => {
    clearInterval(progressInterval);
    progressElement.classList.add('hidden');
    showError('AI prompt extraction failed.');
  });
}

function updatePromptDisplay() {
  document.getElementById('promptContent').textContent = currentState.currentPrompt || 'Upload or paste an image to generate your prompt';
}

function copyPrompt() {
  const promptText = currentState.currentPrompt;
  if (!promptText) return;
  navigator.clipboard.writeText(promptText).then(() => {
    showSuccess('Prompt copied!');
  });
}

function clearImage() {
  currentState.currentImage = null;
  currentState.currentPrompt = '';
  document.getElementById('uploadArea').classList.remove('hidden');
  document.getElementById('imageDisplay').classList.add('hidden');
  document.getElementById('analysisProgress').classList.add('hidden');
  document.getElementById('analysisComplete').classList.add('hidden');
  updatePromptDisplay();
}

function showSuccess(msg) {
  const feedback = document.createElement('div');
  feedback.className = 'success-feedback';
  feedback.textContent = msg;
  document.body.appendChild(feedback);
  setTimeout(() => {
    if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
  }, 1500);
}

function showError(msg) {
  const feedback = document.createElement('div');
  feedback.className = 'error-feedback';
  feedback.textContent = msg;
  document.body.appendChild(feedback);
  setTimeout(() => {
    if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
  }, 2500);
}
