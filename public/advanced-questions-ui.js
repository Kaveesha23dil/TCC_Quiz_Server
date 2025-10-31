/**
 * Advanced Question Types UI Components
 * Client-side rendering and interaction handlers
 */

const AdvancedQuestionsUI = {
  /**
   * Render a matching question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderMatchingQuestion(question, container, questionIndex) {
    const leftItems = question.leftItems || [];
    const rightItems = question.rightItems || [];

    let html = `
      <div class="matching-question" data-question-index="${questionIndex}">
        <p class="question-instructions">Match items from the left column to the right column:</p>
        <div class="matching-container">
          <div class="matching-left">
            ${leftItems.map((item, idx) => `
              <div class="matching-item left-item" data-item-id="${item.id}">
                <div class="item-content">${item.content}</div>
                <select class="matching-select" data-left-id="${item.id}">
                  <option value="">-- Select --</option>
                  ${rightItems.map(right => `
                    <option value="${right.id}">${right.content}</option>
                  `).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.matching-select').forEach(select => {
      select.addEventListener('change', (e) => {
        this.updateMatchingAnswer(questionIndex);
      });
    });
  },

  updateMatchingAnswer(questionIndex) {
    const container = document.querySelector(`[data-question-index="${questionIndex}"]`);
    const selects = container.querySelectorAll('.matching-select');
    const answer = {};

    selects.forEach(select => {
      const leftId = select.getAttribute('data-left-id');
      const rightId = select.value;
      if (rightId) {
        answer[leftId] = rightId;
      }
    });

    // Store answer (assuming global answers array exists)
    if (typeof window.answers !== 'undefined') {
      window.answers[questionIndex] = answer;
    }
  },

  /**
   * Render an ordering/sequencing question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderOrderingQuestion(question, container, questionIndex) {
    const items = question.items || [];
    const shuffled = question.shuffleItems ? this.shuffleArray([...items]) : items;

    let html = `
      <div class="ordering-question" data-question-index="${questionIndex}">
        <p class="question-instructions">Arrange the following items in the correct order:</p>
        <div class="ordering-container" id="ordering-${questionIndex}">
          ${shuffled.map((item, idx) => `
            <div class="ordering-item" draggable="true" data-item-id="${item.id}" data-original-order="${idx}">
              <span class="drag-handle">☰</span>
              <span class="item-content">${item.content}</span>
              <span class="order-number">${idx + 1}</span>
            </div>
          `).join('')}
        </div>
        <div class="ordering-buttons">
          <button type="button" class="btn-small" onclick="AdvancedQuestionsUI.moveItemUp(${questionIndex}, event)">
            ↑ Move Up
          </button>
          <button type="button" class="btn-small" onclick="AdvancedQuestionsUI.moveItemDown(${questionIndex}, event)">
            ↓ Move Down
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Setup drag and drop
    this.setupDragAndDrop(questionIndex);
  },

  setupDragAndDrop(questionIndex) {
    const container = document.getElementById(`ordering-${questionIndex}`);
    const items = container.querySelectorAll('.ordering-item');

    let draggedElement = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedElement = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
        this.updateOrderingAnswer(questionIndex);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
          container.appendChild(draggedElement);
        } else {
          container.insertBefore(draggedElement, afterElement);
        }
      });
    });

    this.updateOrderingAnswer(questionIndex);
  },

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ordering-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  moveItemUp(questionIndex, event) {
    event.preventDefault();
    const container = document.getElementById(`ordering-${questionIndex}`);
    const items = container.querySelectorAll('.ordering-item');

    // Find selected item (you might want to add a selection mechanism)
    // For now, just move the first item up
    if (items.length > 1) {
      container.insertBefore(items[1], items[0]);
      this.updateOrderingAnswer(questionIndex);
    }
  },

  moveItemDown(questionIndex, event) {
    event.preventDefault();
    const container = document.getElementById(`ordering-${questionIndex}`);
    const items = container.querySelectorAll('.ordering-item');

    if (items.length > 1) {
      container.insertBefore(items[0], items[2] || null);
      this.updateOrderingAnswer(questionIndex);
    }
  },

  updateOrderingAnswer(questionIndex) {
    const container = document.getElementById(`ordering-${questionIndex}`);
    const items = container.querySelectorAll('.ordering-item');
    const answer = [];

    items.forEach((item, idx) => {
      const itemId = item.getAttribute('data-item-id');
      answer.push(itemId);
      item.querySelector('.order-number').textContent = idx + 1;
    });

    if (typeof window.answers !== 'undefined') {
      window.answers[questionIndex] = answer;
    }
  },

  /**
   * Render a hotspot/image mapping question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderHotspotQuestion(question, container, questionIndex) {
    const imageUrl = question.imageUrl || '';
    const maxClicks = question.maxClicks || 10;

    let html = `
      <div class="hotspot-question" data-question-index="${questionIndex}">
        <p class="question-instructions">${question.instructions || 'Click on the correct areas in the image:'}</p>
        <div class="hotspot-container">
          <div class="hotspot-canvas-wrapper" id="hotspot-wrapper-${questionIndex}">
            <img src="${imageUrl}" alt="Question Image" id="hotspot-img-${questionIndex}" class="hotspot-image">
            <canvas id="hotspot-canvas-${questionIndex}" class="hotspot-overlay"></canvas>
          </div>
          <div class="hotspot-info">
            <p>Clicks: <span id="hotspot-count-${questionIndex}">0</span> / ${maxClicks}</p>
            <button type="button" class="btn-small btn-danger" onclick="AdvancedQuestionsUI.clearHotspots(${questionIndex})">
              Clear All
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Setup canvas
    setTimeout(() => {
      this.setupHotspotCanvas(questionIndex, maxClicks);
    }, 100);
  },

  setupHotspotCanvas(questionIndex, maxClicks) {
    const img = document.getElementById(`hotspot-img-${questionIndex}`);
    const canvas = document.getElementById(`hotspot-canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    const clicks = [];

    // Set canvas size to match image
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
    };

    if (img.complete) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    canvas.addEventListener('click', (e) => {
      if (clicks.length >= maxClicks) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      clicks.push({ x, y });

      // Draw click marker
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clicks.length, x, y);

      // Update count
      document.getElementById(`hotspot-count-${questionIndex}`).textContent = clicks.length;

      // Store answer
      if (typeof window.answers !== 'undefined') {
        window.answers[questionIndex] = clicks;
      }
    });
  },

  clearHotspots(questionIndex) {
    const canvas = document.getElementById(`hotspot-canvas-${questionIndex}`);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById(`hotspot-count-${questionIndex}`).textContent = '0';

    if (typeof window.answers !== 'undefined') {
      window.answers[questionIndex] = [];
    }
  },

  /**
   * Render a drag-and-drop question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderDragDropQuestion(question, container, questionIndex) {
    const items = question.items || [];
    const dropZones = question.dropZones || [];

    let html = `
      <div class="drag-drop-question" data-question-index="${questionIndex}">
        <p class="question-instructions">Drag items to the correct categories:</p>
        <div class="drag-drop-container">
          <div class="drag-items-pool" id="drag-pool-${questionIndex}">
            <h4>Items:</h4>
            ${items.map(item => `
              <div class="drag-item" draggable="true" data-item-id="${item.id}">
                ${item.content}
              </div>
            `).join('')}
          </div>
          <div class="drop-zones">
            ${dropZones.map(zone => `
              <div class="drop-zone" data-zone-id="${zone.id}">
                <h4>${zone.label}</h4>
                <div class="drop-area" id="drop-zone-${questionIndex}-${zone.id}"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Setup drag and drop
    setTimeout(() => {
      this.setupDragDropInteraction(questionIndex);
    }, 100);
  },

  setupDragDropInteraction(questionIndex) {
    const container = document.querySelector(`[data-question-index="${questionIndex}"]`);
    const items = container.querySelectorAll('.drag-item');
    const dropAreas = container.querySelectorAll('.drop-area');
    const pool = container.querySelector('.drag-items-pool');

    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
      });
    });

    // Make pool a drop area too
    this.setupDropArea(pool, questionIndex);

    dropAreas.forEach(area => {
      this.setupDropArea(area, questionIndex);
    });
  },

  setupDropArea(area, questionIndex) {
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', (e) => {
      area.classList.remove('drag-over');
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('drag-over');

      const draggedItem = document.querySelector('.drag-item.dragging');
      if (draggedItem) {
        area.appendChild(draggedItem);
        this.updateDragDropAnswer(questionIndex);
      }
    });
  },

  updateDragDropAnswer(questionIndex) {
    const container = document.querySelector(`[data-question-index="${questionIndex}"]`);
    const dropZones = container.querySelectorAll('.drop-zone');
    const answer = {};

    dropZones.forEach(zone => {
      const zoneId = zone.getAttribute('data-zone-id');
      const dropArea = zone.querySelector('.drop-area');
      const items = dropArea.querySelectorAll('.drag-item');

      answer[zoneId] = Array.from(items).map(item => item.getAttribute('data-item-id'));
    });

    if (typeof window.answers !== 'undefined') {
      window.answers[questionIndex] = answer;
    }
  },

  /**
   * Render a code evaluation question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderCodeQuestion(question, container, questionIndex) {
    const language = question.language || 'javascript';
    const template = question.template || '';

    let html = `
      <div class="code-question" data-question-index="${questionIndex}">
        <p class="question-instructions">${question.instructions || 'Write your code below:'}</p>
        <div class="code-editor-container">
          <div class="code-editor-header">
            <span class="language-badge">${language}</span>
            <span class="editor-label">Code Editor</span>
          </div>
          <textarea
            id="code-editor-${questionIndex}"
            class="code-editor"
            placeholder="Write your code here..."
            spellcheck="false"
          >${template}</textarea>
        </div>
        ${question.testCases ? `
          <div class="test-cases-info">
            <p><strong>Test Cases:</strong> Your code will be tested with ${question.testCases.length} test case(s)</p>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    // Add event listener
    const editor = document.getElementById(`code-editor-${questionIndex}`);
    editor.addEventListener('input', () => {
      if (typeof window.answers !== 'undefined') {
        window.answers[questionIndex] = editor.value;
      }
    });
  },

  /**
   * Render an essay question with rubric
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderEssayQuestion(question, container, questionIndex) {
    const minWords = question.minWords || 0;
    const maxWords = question.maxWords || null;
    const rubric = question.rubric || [];

    let html = `
      <div class="essay-question" data-question-index="${questionIndex}">
        <p class="question-instructions">
          ${question.instructions || 'Write your essay response below:'}
          ${minWords > 0 ? `<br><em>Minimum ${minWords} words required.</em>` : ''}
          ${maxWords ? `<br><em>Maximum ${maxWords} words allowed.</em>` : ''}
        </p>
        <textarea
          id="essay-editor-${questionIndex}"
          class="essay-editor"
          placeholder="Start writing your essay here..."
        ></textarea>
        <div class="word-count">
          Words: <span id="essay-word-count-${questionIndex}">0</span>
          ${minWords > 0 ? ` / ${minWords} minimum` : ''}
        </div>
        ${rubric.length > 0 ? `
          <div class="rubric-preview">
            <h4>Grading Rubric:</h4>
            <ul>
              ${rubric.map(criterion => `
                <li><strong>${criterion.name}</strong> (${criterion.maxPoints} points): ${criterion.description}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    // Add event listener
    const editor = document.getElementById(`essay-editor-${questionIndex}`);
    editor.addEventListener('input', () => {
      const text = editor.value;
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      document.getElementById(`essay-word-count-${questionIndex}`).textContent = wordCount;

      if (typeof window.answers !== 'undefined') {
        window.answers[questionIndex] = text;
      }
    });
  },

  /**
   * Render an audio/video-based question
   * @param {Object} question - Question data
   * @param {HTMLElement} container - Container element
   * @param {Number} questionIndex - Index of question
   */
  renderMediaQuestion(question, container, questionIndex) {
    const mediaType = question.mediaType || 'audio';
    const mediaUrl = question.mediaUrl || '';
    const responseType = question.responseType || 'multiple-choice';

    let html = `
      <div class="media-question" data-question-index="${questionIndex}">
        <p class="question-instructions">${question.instructions || 'Listen/watch the media and answer the question:'}</p>
        <div class="media-player">
          ${mediaType === 'audio' ? `
            <audio controls src="${mediaUrl}" class="audio-player"></audio>
          ` : `
            <video controls src="${mediaUrl}" class="video-player"></video>
          `}
        </div>
    `;

    // Add response area based on type
    if (responseType === 'multiple-choice') {
      const options = question.options || [];
      html += `
        <div class="media-response">
          ${options.map((option, idx) => `
            <label class="option-label">
              <input type="radio" name="media-q-${questionIndex}" value="${option.value || idx}" class="radio-custom">
              <span>${option.text}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (responseType === 'short-answer') {
      html += `
        <div class="media-response">
          <textarea id="media-answer-${questionIndex}" class="media-text-answer" placeholder="Your answer..."></textarea>
        </div>
      `;
    } else if (responseType === 'timestamp') {
      html += `
        <div class="media-response">
          <label>At what time (in seconds) does the event occur?</label>
          <input type="number" id="media-timestamp-${questionIndex}" class="timestamp-input" min="0" step="0.1">
        </div>
      `;
    }

    html += `</div>`;

    container.innerHTML = html;

    // Add event listeners based on response type
    if (responseType === 'multiple-choice') {
      container.querySelectorAll(`input[name="media-q-${questionIndex}"]`).forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (typeof window.answers !== 'undefined') {
            window.answers[questionIndex] = e.target.value;
          }
        });
      });
    } else if (responseType === 'short-answer') {
      const textarea = document.getElementById(`media-answer-${questionIndex}`);
      textarea.addEventListener('input', () => {
        if (typeof window.answers !== 'undefined') {
          window.answers[questionIndex] = textarea.value;
        }
      });
    } else if (responseType === 'timestamp') {
      const input = document.getElementById(`media-timestamp-${questionIndex}`);
      input.addEventListener('input', () => {
        if (typeof window.answers !== 'undefined') {
          window.answers[questionIndex] = parseFloat(input.value) || 0;
        }
      });
    }
  },

  /**
   * Utility function to shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.AdvancedQuestionsUI = AdvancedQuestionsUI;
}
