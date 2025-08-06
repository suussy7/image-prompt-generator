// Application data
const appData = {
  analysisCategories: [
    {
      name: "Subject & Composition",
      enabled: true,
      aspects: ["main subject", "secondary elements", "camera angle", "framing", "composition rules"]
    },
    {
      name: "Lighting & Atmosphere", 
      enabled: true,
      aspects: ["light source", "shadows", "mood", "atmosphere", "color temperature"]
    },
    {
      name: "Style & Technique",
      enabled: true, 
      aspects: ["art style", "medium", "genre", "artistic influences", "technique"]
    },
    {
      name: "Technical Details",
      enabled: false,
      aspects: ["depth of field", "perspective", "focal length", "quality", "post-processing"]
    },
    {
      name: "Color & Materials",
      enabled: true,
      aspects: ["color palette", "materials", "textures", "surface properties", "finishes"]
    }
  ],
  analysisModes: [
    {
      name: "Basic",
      description: "Simple, concise prompt focusing on main elements"
    },
    {
      name: "Detailed", 
      description: "Comprehensive analysis with specific details"
    },
    {
      name: "Technical",
      description: "Camera settings, lighting setup, and technical aspects"
    },
    {
      name: "Creative",
      description: "Artistic interpretation with mood and style emphasis"
    }
  ],
  promptLengths: ["Short", "Medium", "Long", "Ultra-detailed"],
  outputFormats: ["Generic", "Midjourney", "DALL-E", "Stable Diffusion"],
  samplePrompts: [
    {
      title: "Portrait Example",
      prompt: "A cinematic portrait of a young woman with flowing auburn hair, shot during golden hour with warm, soft lighting creating rim light around her silhouette, shallow depth of field with bokeh background, film photography aesthetic, professional headshot style, natural makeup, serene expression"
    },
    {
      title: "Product Example", 
      prompt: "A photorealistic product shot of a luxury smartwatch on white marble surface, studio lighting with key light and fill light, reflective metal band, clean minimalist composition, high-end commercial photography style, sharp focus, neutral background"
    },
    {
      title: "Landscape Example",
      prompt: "A dramatic landscape photograph of mountain peaks during sunrise, misty valleys below, warm orange and pink sky, wide-angle composition, natural lighting, high contrast, landscape photography, majestic atmosphere, detailed textures"
    }
  ]
};

// Application state
let currentState = {
  currentMode: 'Basic',
  currentImage: null,
  categories: {},
  promptLength: 'Medium',
  outputFormat: 'Generic',
  generateNegativePrompt: false,
  currentPrompt: '',
  currentNegativePrompt: ''
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// --- Paste support for images from clipboard ---
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

function initializeApp() {
  // Initialize category states
  appData.analysisCategories.forEach(category => {
    currentState.categories[category.name] = category.enabled;
  });

  // Setup event listeners
  setupEventListeners();
  
  // Initialize UI state
  updateUI();
}

function setupEventListeners() {
  // File upload
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const uploadArea = document.getElementById('uploadArea');

  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('dragleave', handleDragLeave);
  uploadArea.addEventListener('drop', handleFileDrop);

  // Mode selector
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.mode;
      switchMode(mode);
    });
  });

  // Category toggles
  document.querySelectorAll('.category-card').forEach((card, index) => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const categoryName = appData.analysisCategories[index].name;
    
    // Set initial state
    checkbox.checked = currentState.categories[categoryName];
    
    // Add event listener
    checkbox.addEventListener('change', (e) => {
      currentState.categories[categoryName] = e.target.checked;
      if (currentState.currentImage) {
        generatePrompt();
      }
    });
    
    // Also allow clicking on the card to toggle
    card.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        checkbox.checked = !checkbox.checked;
        currentState.categories[categoryName] = checkbox.checked;
        if (currentState.currentImage) {
          generatePrompt();
        }
      }
    });
  });

  // Controls
  document.getElementById('promptLength').addEventListener('change', (e) => {
    currentState.promptLength = e.target.value;
    generatePrompt();
  });

  document.getElementById('outputFormat').addEventListener('change', (e) => {
    currentState.outputFormat = e.target.value;
    generatePrompt();
  });

  document.getElementById('negativePrompt').addEventListener('change', (e) => {
    currentState.generateNegativePrompt = e.target.checked;
    toggleNegativePrompt();
    if (currentState.generateNegativePrompt) {
      generateNegativePrompt();
    }
  });

  // Action buttons
  document.getElementById('copyBtn').addEventListener('click', copyPrompt);
  document.getElementById('exportBtn').addEventListener('click', exportPrompt);
  document.getElementById('clearImageBtn').addEventListener('click', clearImage);
  document.getElementById('zoomBtn').addEventListener('click', showImageZoom);

  // Sample images
  document.querySelectorAll('.sample-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const sampleType = e.currentTarget.dataset.sample;
      loadSampleImage(sampleType);
    });
  });

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  } else {
    showError('Please select a valid image file');
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleFileDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    loadImage(files[0]);
  } else {
    showError('Please drop a valid image file');
  }
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    currentState.currentImage = e.target.result;
    displayImage(e.target.result);
    startAnalysis();
  };
  reader.readAsDataURL(file);
}

function loadSampleImage(sampleType) {
  // Find the corresponding sample data
  const sampleData = appData.samplePrompts.find(sample => 
    sample.title.toLowerCase().includes(sampleType)
  );
  
  if (sampleData) {
    // Create a placeholder image representation
    currentState.currentImage = `sample-${sampleType}`;
    displaySampleImage(sampleType);
    startAnalysis(sampleData.prompt);
  }
}

function displayImage(imageSrc) {
  const uploadArea = document.getElementById('uploadArea');
  const imageDisplay = document.getElementById('imageDisplay');
  const uploadedImage = document.getElementById('uploadedImage');

  uploadArea.classList.add('hidden');
  imageDisplay.classList.remove('hidden');
  uploadedImage.src = imageSrc;
}

function displaySampleImage(sampleType) {
  const uploadArea = document.getElementById('uploadArea');
  const imageDisplay = document.getElementById('imageDisplay');
  const uploadedImage = document.getElementById('uploadedImage');

  // Create a visual placeholder for sample images
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Set background gradient based on sample type
  const gradients = {
    portrait: ['#FFC185', '#FF9D6C'],
    product: ['#B4413C', '#8B3429'], 
    landscape: ['#5D878F', '#4A6B73']
  };
  
  const colors = gradients[sampleType] || ['#1FB8CD', '#159BAF'];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add sample content based on type
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  
  const titles = {
    portrait: '👤 Portrait Sample',
    product: '⌚ Product Sample',
    landscape: '🏔️ Landscape Sample'
  };
  
  ctx.fillText(titles[sampleType] || 'Sample Image', canvas.width/2, canvas.height/2 - 10);
  
  ctx.font = '16px Arial';
  ctx.fillText('AI Generated Placeholder', canvas.width/2, canvas.height/2 + 25);

  uploadArea.classList.add('hidden');
  imageDisplay.classList.remove('hidden');
  uploadedImage.src = canvas.toDataURL();
}

function startAnalysis(samplePrompt = null) {
  const progressElement = document.getElementById('analysisProgress');
  const completeElement = document.getElementById('analysisComplete');
  const progressFill = document.querySelector('.progress-fill');

  // Show progress
  progressElement.classList.remove('hidden');
  completeElement.classList.add('hidden');

  // Animate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      
      // Show completion
      setTimeout(() => {
        progressElement.classList.add('hidden');
        completeElement.classList.remove('hidden');
        
        // Generate prompt
        if (samplePrompt) {
          currentState.currentPrompt = samplePrompt;
        } else {
          generatePrompt();
        }
        updatePromptDisplay();
      }, 500);
    }
    progressFill.style.width = progress + '%';
  }, 150);
}

function switchMode(mode) {
  currentState.currentMode = mode;
  
  // Update UI
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  
  // Regenerate prompt if image is loaded
  if (currentState.currentImage) {
    generatePrompt();
  }
}

function generatePrompt() {
  if (!currentState.currentImage) return;

  const enabledCategories = Object.keys(currentState.categories)
    .filter(cat => currentState.categories[cat]);

  let prompt = buildPromptFromCategories(enabledCategories);
  
  // Adjust for mode
  prompt = adjustPromptForMode(prompt, currentState.currentMode);
  
  // Adjust for length
  prompt = adjustPromptForLength(prompt, currentState.promptLength);
  
  // Adjust for output format
  prompt = adjustPromptForFormat(prompt, currentState.outputFormat);
  
  currentState.currentPrompt = prompt;
  updatePromptDisplay();
}

function buildPromptFromCategories(enabledCategories) {
  let promptParts = [];
  
  // Base prompt varies by image type
  const imageType = currentState.currentImage && typeof currentState.currentImage === 'string' && currentState.currentImage.includes('sample-portrait') ? 'portrait' :
                   currentState.currentImage && typeof currentState.currentImage === 'string' && currentState.currentImage.includes('sample-product') ? 'product' :
                   currentState.currentImage && typeof currentState.currentImage === 'string' && currentState.currentImage.includes('sample-landscape') ? 'landscape' : 'general';
  
  if (enabledCategories.includes('Subject & Composition')) {
    switch (imageType) {
      case 'portrait':
        promptParts.push('professional portrait photography', 'elegant subject pose', 'rule of thirds composition');
        break;
      case 'product':
        promptParts.push('commercial product photography', 'clean composition', 'centered subject');
        break;
      case 'landscape':
        promptParts.push('landscape photography', 'wide composition', 'natural framing');
        break;
      default:
        promptParts.push('well-composed subject', 'balanced composition');
    }
  }
  
  if (enabledCategories.includes('Lighting & Atmosphere')) {
    switch (imageType) {
      case 'portrait':
        promptParts.push('soft natural lighting', 'warm atmospheric mood', 'golden hour ambiance');
        break;
      case 'product':
        promptParts.push('studio lighting setup', 'controlled illumination', 'clean bright atmosphere');
        break;
      case 'landscape':
        promptParts.push('dramatic natural lighting', 'atmospheric perspective', 'dynamic sky');
        break;
      default:
        promptParts.push('natural lighting', 'balanced exposure');
    }
  }
  
  if (enabledCategories.includes('Style & Technique')) {
    switch (imageType) {
      case 'portrait':
        promptParts.push('contemporary portrait style', 'fine art photography', 'professional technique');
        break;
      case 'product':
        promptParts.push('commercial photography style', 'minimalist aesthetic', 'professional quality');
        break;
      case 'landscape':
        promptParts.push('fine art landscape style', 'nature photography', 'artistic vision');
        break;
      default:
        promptParts.push('professional photography style', 'artistic technique');
    }
  }
  
  if (enabledCategories.includes('Technical Details')) {
    promptParts.push('shallow depth of field', 'tack sharp focus', 'high resolution', 'professional camera work');
  }
  
  if (enabledCategories.includes('Color & Materials')) {
    switch (imageType) {
      case 'portrait':
        promptParts.push('natural skin tones', 'harmonious color palette', 'soft textures');
        break;
      case 'product':
        promptParts.push('accurate colors', 'premium materials', 'reflective surfaces');
        break;
      case 'landscape':
        promptParts.push('vibrant natural colors', 'organic textures', 'rich earth tones');
        break;
      default:
        promptParts.push('rich color palette', 'detailed textures');
    }
  }
  
  return promptParts.join(', ');
}

function adjustPromptForMode(prompt, mode) {
  switch (mode) {
    case 'Basic':
      return prompt.split(', ').slice(0, 5).join(', ');
    case 'Detailed':
      return prompt + ', highly detailed, intricate details, fine art quality, masterful execution';
    case 'Technical':
      return prompt + ', shot with professional DSLR, perfect exposure, precise focus, technical excellence, optimal camera settings';
    case 'Creative':
      return prompt + ', artistic vision, creative composition, expressive mood, imaginative style, emotional depth';
    default:
      return prompt;
  }
}

function adjustPromptForLength(prompt, length) {
  const parts = prompt.split(', ');
  
  switch (length) {
    case 'Short':
      return parts.slice(0, 4).join(', ');
    case 'Medium':
      return parts.slice(0, 8).join(', ');
    case 'Long':
      return parts.slice(0, 12).join(', ');
    case 'Ultra-detailed':
      return prompt + ', extremely detailed, hyperrealistic, award-winning photography, masterpiece quality, perfect execution, professional grade, museum quality';
    default:
      return prompt;
  }
}

function adjustPromptForFormat(prompt, format) {
  switch (format) {
    case 'Midjourney':
      return prompt + ' --v 6 --style raw --ar 16:9 --q 2';
    case 'DALL-E':
      return 'Create a high-quality image: ' + prompt;
    case 'Stable Diffusion':
      return prompt + ', 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3, photorealistic';
    default:
      return prompt;
  }
}

function toggleNegativePrompt() {
  const negativeSection = document.getElementById('negativePromptContent');
  if (currentState.generateNegativePrompt) {
    negativeSection.classList.remove('hidden');
    generateNegativePrompt();
  } else {
    negativeSection.classList.add('hidden');
  }
}

function generateNegativePrompt() {
  const commonNegatives = [
    'blurry', 'low quality', 'distorted', 'poorly lit', 'overexposed', 
    'underexposed', 'noise', 'artifacts', 'bad composition', 'amateur',
    'pixelated', 'grainy', 'out of focus', 'cropped badly', 'watermark'
  ];
  
  currentState.currentNegativePrompt = commonNegatives.join(', ');
  document.getElementById('negativePromptText').textContent = currentState.currentNegativePrompt;
}

function updatePromptDisplay() {
  const promptContent = document.getElementById('promptContent');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  
  promptContent.textContent = currentState.currentPrompt;
  
  const words = currentState.currentPrompt.split(/\s+/).filter(word => word.length > 0).length;
  const chars = currentState.currentPrompt.length;
  
  wordCount.textContent = `${words} words`;
  charCount.textContent = `${chars} characters`;
}

function copyPrompt() {
  const promptText = currentState.currentPrompt;
  const negativeText = currentState.generateNegativePrompt ? 
    `\n\nNegative Prompt: ${currentState.currentNegativePrompt}` : '';
  
  const fullText = promptText + negativeText;
  
  navigator.clipboard.writeText(fullText).then(() => {
    showSuccess('Prompt copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = fullText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showSuccess('Prompt copied to clipboard!');
  });
}

function exportPrompt() {
  const exportData = {
    prompt: currentState.currentPrompt,
    negativePrompt: currentState.generateNegativePrompt ? currentState.currentNegativePrompt : null,
    settings: {
      mode: currentState.currentMode,
      length: currentState.promptLength,
      format: currentState.outputFormat,
      categories: currentState.categories
    },
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccess('Prompt exported successfully!');
}

function clearImage() {
  currentState.currentImage = null;
  currentState.currentPrompt = '';
  currentState.currentNegativePrompt = '';
  
  const uploadArea = document.getElementById('uploadArea');
  const imageDisplay = document.getElementById('imageDisplay');
  const progressElement = document.getElementById('analysisProgress');
  const completeElement = document.getElementById('analysisComplete');
  const promptContent = document.getElementById('promptContent');
  const negativeSection = document.getElementById('negativePromptContent');
  
  uploadArea.classList.remove('hidden');
  imageDisplay.classList.add('hidden');
  progressElement.classList.add('hidden');
  completeElement.classList.add('hidden');
  negativeSection.classList.add('hidden');
  
  promptContent.innerHTML = '<p class="placeholder-text">Upload an image or select a sample to generate a detailed prompt description.</p>';
  
  updatePromptStats();
}

function updatePromptStats() {
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  
  wordCount.textContent = '0 words';
  charCount.textContent = '0 characters';
}

function showImageZoom() {
  if (!currentState.currentImage) return;
  
  const modal = document.getElementById('zoomModal');
  const zoomedImage = document.getElementById('zoomedImage');
  const uploadedImage = document.getElementById('uploadedImage');
  
  zoomedImage.src = uploadedImage.src;
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('zoomModal');
  modal.classList.add('hidden');
}

function showSuccess(message) {
  const feedback = document.createElement('div');
  feedback.className = 'success-feedback';
  feedback.textContent = message;
  
  const promptActions = document.querySelector('.prompt-actions');
  promptActions.appendChild(feedback);
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 3000);
}

function showError(message) {
  const feedback = document.createElement('div');
  feedback.className = 'error-feedback';
  feedback.textContent = message;
  
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.appendChild(feedback);
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 3000);
}

function updateUI() {
  // Set initial mode
  document.querySelector(`[data-mode="${currentState.currentMode}"]`).classList.add('active');
  
  // Set initial prompt length
  document.getElementById('promptLength').value = currentState.promptLength;
  
  // Set initial output format
  document.getElementById('outputFormat').value = currentState.outputFormat;
  
  // Initialize prompt display
  updatePromptStats();
}
