function animateCounter(element, finalValue) {
  let currentValue = 0;
  const increment = finalValue / 50;
  const timer = setInterval(() => {
    currentValue += increment;
    if (currentValue >= finalValue) {
      currentValue = finalValue;
      clearInterval(timer);
    }

    if (finalValue === 95) {
      element.textContent = Math.floor(currentValue) + "%";
    } else if (finalValue === 24) {
      element.textContent = "24/7";
    } else if (finalValue >= 1000) {
      element.textContent = Math.floor(currentValue) + "+";
    } else {
      element.textContent = Math.floor(currentValue) + "+";
    }
  }, 40);
}

// AI Assistant Logic
class GovernmentServicesAI {
  constructor() {
    this.isOpen = false;
    this.isTyping = false;
    this.initializeElements();
    this.initializeEventListeners();
    this.knowledgeBase = this.createKnowledgeBase();
  }

  initializeElements() {
    this.chatToggle = document.getElementById("aiChatToggle");
    this.chatWindow = document.getElementById("aiChatWindow");
    this.chatMessages = document.getElementById("aiChatMessages");
    this.chatInput = document.getElementById("aiInput");
    this.sendBtn = document.getElementById("aiSendBtn");
  }

  initializeEventListeners() {
    this.chatToggle.addEventListener("click", () => this.toggleChat());
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    // Quick action buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("ai-quick-action")) {
        const action = e.target.getAttribute("data-action");
        this.handleQuickAction(action);
      }
    });
  }

  createKnowledgeBase() {
    return {
      "civil-status": {
        title: "خدمات الأحوال المدنية",
        info: "يمكنك الحصول على الخدمات التالية:\n• استخراج بطاقة الرقم القومي الجديدة أو البدل\n• شهادات الميلاد والوفاة والزواج والطلاق\n• تغيير العنوان في البطاقة\n• تجديد البطاقة المنتهية الصلاحية\n\nالمستندات المطلوبة: صورة من البطاقة القديمة، صور شخصية، إيصال كهرباء حديث",
        link: "https://www.moi.gov.eg/wps/portal/Home/civilstatus",
      },
      traffic: {
        title: "الخدمات المرورية",
        info: "الخدمات المتاحة:\n• الاستعلام عن المخالفات المرورية برقم اللوحة\n• دفع المخالفات أونلاين بالفيزا أو فوري\n• تجديد رخصة القيادة\n• استخراج رخصة قيادة جديدة\n• استخراج بدل فاقد أو تالف للرخصة\n\nيمكنك زيارة أقرب وحدة مرور أو استخدام الخدمات الإلكترونية",
        link: "https://www.moi.gov.eg/wps/portal/Home/traffic",
      },
      building: {
        title: "خدمات الحكم المحلي",
        info: "خدمات البناء والتراخيص:\n• طلب ترخيص بناء جديد\n• طلب ترخيص هدم\n• تقديم شكوى مخالفة بناء\n• طلب تقنين الأراضي\n• الاستعلام عن قرارات الهدم\n• تراخيص المحلات التجارية\n\nيرجى إحضار المستندات المطلوبة وزيارة مكتب الحي المختص",
        link: "https://lgs.gov.eg/",
      },
      supply: {
        title: "خدمات التموين",
        info: "خدمات بطاقة التموين:\n• إضافة أفراد جدد للبطاقة\n• حذف أفراد من البطاقة\n• استخراج بدل فاقد أو تالف\n• تحديث بيانات الأسرة\n• الاستعلام عن توزيع السلع\n• نقل البطاقة لمحافظة أخرى\n\nيمكنك زيارة مكتب التموين أو استخدام الموقع الإلكتروني",
        link: "https://www.moss.gov.eg/",
      },
      map: {
        title: "خريطة الخدمات المحلية",
        info: "خريطة تفاعلية تساعدك في:\n• العثور على أقرب مكتب حكومي\n• معرفة مواعيد العمل\n• الحصول على إرشادات الوصول\n• معرفة الخدمات المتاحة في كل مكان\n• أرقام التواصل والعناوين\n\nاستخدم الخريطة للوصول بسهولة لأي خدمة تحتاجها",
        link: "https://maps.google.com/search/government+services+qalyubia",
      },
    };
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.chatToggle.classList.toggle("active", this.isOpen);
    this.chatWindow.classList.toggle("active", this.isOpen);

    if (this.isOpen) {
      this.chatInput.focus();
    }
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isTyping) return;

    this.addMessage(message, "user");
    this.chatInput.value = "";
    this.sendBtn.disabled = true;

    await this.showTyping();
    const response = this.generateResponse(message);
    this.hideTyping();
    this.addMessage(response, "assistant");

    this.sendBtn.disabled = false;
    this.chatInput.focus();
  }

  addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `ai-message ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "ai-message-avatar";
    avatar.innerHTML =
      sender === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const messageContent = document.createElement("div");
    messageContent.className = "ai-message-content";
    messageContent.innerHTML = content.replace(/\n/g, "<br>");

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  async showTyping() {
    this.isTyping = true;
    const typingDiv = document.createElement("div");
    typingDiv.className = "ai-message assistant";
    typingDiv.id = "typing-indicator";

    typingDiv.innerHTML = `
            <div class="ai-message-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="ai-typing">
              <div class="ai-typing-dots">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
              </div>
            </div>
          `;

    this.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();

    // Simulate thinking time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    );
  }

  hideTyping() {
    this.isTyping = false;
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Check for greetings
    if (
      lowerMessage.includes("مرحبا") ||
      lowerMessage.includes("السلام") ||
      lowerMessage.includes("أهلا")
    ) {
      return "مرحباً بك! أنا هنا لمساعدتك في جميع الخدمات الحكومية. كيف يمكنني مساعدتك اليوم؟";
    }

    // Check for thanks
    if (lowerMessage.includes("شكرا") || lowerMessage.includes("شكراً")) {
      return "العفو! أتمنى أن أكون قد ساعدتك. لا تتردد في السؤال عن أي خدمة أخرى.";
    }

    // Check for specific services
    if (
      lowerMessage.includes("بطاقة") ||
      lowerMessage.includes("رقم قومي") ||
      lowerMessage.includes("أحوال")
    ) {
      return this.getServiceInfo("civil-status");
    }

    if (
      lowerMessage.includes("مرور") ||
      lowerMessage.includes("رخصة") ||
      lowerMessage.includes("مخالفة")
    ) {
      return this.getServiceInfo("traffic");
    }

    if (
      lowerMessage.includes("بناء") ||
      lowerMessage.includes("ترخيص") ||
      lowerMessage.includes("هدم")
    ) {
      return this.getServiceInfo("building");
    }

    if (
      lowerMessage.includes("تموين") ||
      lowerMessage.includes("سلع") ||
      lowerMessage.includes("بطاقة تموين")
    ) {
      return this.getServiceInfo("supply");
    }

    if (
      lowerMessage.includes("خريطة") ||
      lowerMessage.includes("موقع") ||
      lowerMessage.includes("عنوان")
    ) {
      return this.getServiceInfo("map");
    }

    // Check for working hours
    if (
      lowerMessage.includes("مواعيد") ||
      lowerMessage.includes("ساعات العمل")
    ) {
      return "مواعيد العمل الرسمية:\n• الأحد إلى الخميس: 8:00 ص - 2:00 م\n• بعض الخدمات الإلكترونية متاحة 24/7\n• يُنصح بالحضور مبكراً لتجنب الازدحام";
    }

    // Check for working hours
    if (lowerMessage.includes("مسا")) {
      return "مسا مسا";
    }

    // Check for documents
    if (
      lowerMessage.includes("مستندات") ||
      lowerMessage.includes("أوراق") ||
      lowerMessage.includes("وثائق")
    ) {
      return "المستندات المطلوبة تختلف حسب نوع الخدمة:\n• صورة من البطاقة الشخصية\n• صور شخصية حديثة\n• إيصال كهرباء أو غاز حديث\n• المستندات الأصلية للخدمة المطلوبة\n\nيرجى تحديد نوع الخدمة للحصول على قائمة مفصلة";
    }

    // Default response
    return "أعتذر، لم أفهم سؤالك بوضوح. يمكنني مساعدتك في:\n• خدمات الأحوال المدنية\n• الخدمات المرورية\n• تراخيص البناء\n• خدمات التموين\n• خريطة الخدمات\n\nيرجى اختيار إحدى هذه الخدمات أو إعادة صياغة سؤالك.";
  }

  getServiceInfo(serviceKey) {
    const service = this.knowledgeBase[serviceKey];
    return `**${service.title}**\n\n${service.info}\n\nللمزيد من المعلومات، يمكنك زيارة الموقع الرسمي أو الاتصال بالخط الساخن 114.`;
  }

  handleQuickAction(action) {
    if (!this.isOpen) {
      this.toggleChat();
    }

    setTimeout(() => {
      const response = this.getServiceInfo(action);
      this.addMessage(response, "assistant");
    }, 300);
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}

// Initialize AI Assistant
let aiAssistant;
document.addEventListener("DOMContentLoaded", () => {
  // Animate stats on scroll
  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px",
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll(".stat-number-gov");
        statNumbers.forEach((stat) => {
          const finalValue = parseInt(stat.getAttribute("data-count"));
          animateCounter(stat, finalValue);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const statsSection = document.querySelector(".stats-section-gov");
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // Animate service cards on scroll
  const cardsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".service-card-enhanced").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(50px)";
    card.style.transition = `opacity 0.6s ease ${
      index * 0.1
    }s, transform 0.6s ease ${index * 0.1}s`;
    cardsObserver.observe(card);
  });

  setTimeout(() => {
    aiAssistant = new GovernmentServicesAI();
  }, 500);
});

